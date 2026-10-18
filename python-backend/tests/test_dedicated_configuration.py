"""Dedicated configuration checks with all provider and payment writes mocked."""
import json
from datetime import datetime
from types import SimpleNamespace as NS
from unittest.mock import MagicMock, patch

import pytest

from app.models.models import OrderStatus, ServiceCategory
from app.routers import compat
from app.services import catalog_service as catalog, order_service as orders


def plan():
    return NS(
        plan_code="24adv01-v3-mum", category=ServiceCategory.DEDICATED,
        override_margin=None, override_price=None,
        catalog_metadata={
            "addonFamilies": [
                {"name": "memory", "mandatory": True, "addons": ["ram-128g-24adv01-v3", "ram-32g-24adv01-v3"], "default": "ram-32g-24adv01-v3"},
                {"name": "storage", "mandatory": True, "addons": ["disk-large-24adv01-v3", "disk-base-24adv01-v3"], "default": "disk-base-24adv01-v3"},
            ],
            "configurations": [
                {"name": "dedicated_os", "values": ["none_64.en"]},
                {"name": "dedicated_datacenter", "values": ["ynm"]},
                {"name": "region", "values": ["canada"]},
            ],
            "pricings": [
                {"interval": 1, "intervalUnit": "month", "mode": "default", "price": 12600 * 10**8},
                {"interval": 0, "mode": "default", "capacities": ["installation"], "price": 12600 * 10**8},
                {"interval": 12, "intervalUnit": "month", "mode": "upfront12", "price": 143640 * 10**8},
                {"interval": 0, "mode": "upfront12", "capacities": ["installation"], "price": 0},
            ],
        },
    )


def duration(months=1):
    return NS(interval=months, interval_unit="month", duration_label=f"{months}_month")


def test_stock_requires_exact_included_hardware():
    p = plan()
    rows = [
        {"planCode": p.plan_code, "memory": "ram-128g", "storage": "disk-large",
         "datacenters": [{"datacenter": "ynm", "availability": "1H-high"}]},
        {"planCode": p.plan_code, "memory": "ram-32g", "storage": "disk-base",
         "datacenters": [{"datacenter": "ynm", "availability": "unavailable"}]},
    ]
    response = MagicMock()
    response.__enter__.return_value.read.return_value = json.dumps(rows).encode()
    with patch("urllib.request.urlopen", return_value=response):
        assert compat._ded_dc_availability(p, fresh=True)["ynm"]["status"] == "unavailable"
        rows[1]["datacenters"][0]["availability"] = "72H"
        response.__enter__.return_value.read.return_value = json.dumps(rows).encode()
        result = compat._ded_dc_availability(p, fresh=True)["ynm"]
        assert result["status"] == "available"
        assert result["deliveryHours"] == 72
    with patch("urllib.request.urlopen", side_effect=TimeoutError):
        assert compat._ded_dc_availability(p, fresh=True) == {}


def test_native_terms_and_installation_fee():
    p = plan()
    assert catalog.dedicated_pricing(p, duration()) == ("default", 12600)
    assert catalog.dedicated_pricing(p, duration(12)) == ("upfront12", 0)
    with pytest.raises(ValueError):
        catalog.dedicated_pricing(p, duration(6))
    with patch.object(catalog, "get_metal_ded_margin", return_value=45):
        assert catalog.dedicated_setup_price(None, p, duration(), True) == (18270, 12600)


def test_preorder_does_not_bypass_dedicated_location_or_image():
    p = plan()
    for cfg in [
        {"datacenter": "BOM", "_preorder": True},
        {"dedicated_os": "Ubuntu made-up", "datacenter": "ynm"},
    ]:
        with pytest.raises(ValueError):
            orders._validate_configuration(p, cfg)
    orders._validate_configuration(p, {"datacenter": "ynm", "os": "none_64.en"})


def test_provider_options_use_catalog_defaults_and_native_mode():
    p, ovh = plan(), MagicMock()
    with patch.object(orders, "log_ovh_step"):
        orders._add_mandatory_options(None, ovh, NS(ovh_cart_id="fake", id="test"),
                                     1, "baremetalServers", p, duration(12), {})
    payloads = [call.args[-1] for call in ovh.add_item_option.call_args_list]
    assert [p["planCode"] for p in payloads] == ["ram-32g-24adv01-v3", "disk-base-24adv01-v3"]
    assert all(p["pricingMode"] == "upfront12" and p["duration"] == "P12M" for p in payloads)
    cfg = orders._build_required_configurations(p, {"datacenter": "ynm", "os": "none_64.en"})
    assert {"label": "region", "value": "canada"} in cfg
    assert not any(c["label"] == "language" for c in cfg)


def test_dedicated_watcher_fifo_and_unknown_stock():
    p, db = plan(), MagicMock()
    first = NS(id="first", created_at=datetime.utcnow(), plan_code=p.plan_code,
               configuration_payload={"_preorder": True, "datacenter": "ynm"},
               status=OrderStatus.WAITING_STOCK)
    second = NS(id="second", created_at=datetime.utcnow(), plan_code=p.plan_code,
                configuration_payload={"_preorder": True, "datacenter": "ynm"},
                status=OrderStatus.WAITING_STOCK)
    waiting, failed, plan_query = MagicMock(), MagicMock(), MagicMock()
    waiting.filter.return_value.order_by.return_value.all.return_value = [first, second]
    failed.filter.return_value.order_by.return_value.all.return_value = []
    plan_query.filter.return_value.first.return_value = p
    with patch.object(catalog, "get_preorder_settings", return_value={"enabled": True, "refundDays": 30}), \
         patch.object(compat, "_ded_dc_availability", return_value={}) as stock, \
         patch.object(orders, "spawn_provisioning") as spawn:
        db.query.side_effect = [waiting, failed, plan_query]
        assert orders.preorder_tick(db)["kicked"] == 0
        spawn.assert_not_called()
        stock.return_value = {"ynm": {"status": "available", "deliveryHours": 72}}
        db.query.side_effect = [waiting, failed, plan_query]
        assert orders.preorder_tick(db)["kicked"] == 1
        spawn.assert_called_once_with("first")
        assert second.status == OrderStatus.WAITING_STOCK


def test_first_invoice_includes_setup_once_and_rejects_unknown_stock():
    p, db, d = plan(), MagicMock(), duration()
    d.raw_price, d.currency = 12600, "INR"
    db.query.return_value.filter.return_value.first.return_value = d
    with patch.object(orders, "_resolve_plan_code", return_value=p), \
         patch.object(compat, "_ded_dc_availability", return_value={"ynm": {"status": "available"}}) as stock, \
         patch.object(catalog, "compute_sell_price", return_value=(14112, 0)), \
         patch.object(catalog, "dedicated_setup_price", return_value=(14112, 12600)), \
         patch.object(orders, "convert", return_value=1), \
         patch.object(orders, "get_settings", return_value=NS(tax_rate_percent=18)):
        o = orders.create_customer_order(db, "test-user", p.plan_code, "1_month",
                                        config={"os": "none_64.en", "datacenter": "ynm"}, currency="INR")
        assert o.customer_amount == 33304.32
        assert orders._subscription_amount(o) == 16652.16
        stock.return_value = {}
        with pytest.raises(ValueError, match="Could not verify"):
            orders.create_customer_order(db, "test-user", p.plan_code, "1_month",
                                         config={"os": "none_64.en", "datacenter": "ynm", "_preorder": True}, currency="INR")
