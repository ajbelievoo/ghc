import logging
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

import ovh

from app.core.config import get_settings
from app.core.metrics import OVH_API_CALL_COUNT
from app.models.models import OvhOrderLog

logger = logging.getLogger(__name__)


class OvhClient:
    """Official OVH Cloud API wrapper with cart, order, payment, and service helpers."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        app_key: Optional[str] = None,
        app_secret: Optional[str] = None,
        consumer_key: Optional[str] = None,
        subsidiary: Optional[str] = None,
    ):
        settings = get_settings()
        self.endpoint = endpoint or settings.ovh_endpoint
        self.app_key = app_key or settings.ovh_application_key
        self.app_secret = app_secret or settings.ovh_application_secret
        self.consumer_key = consumer_key or settings.ovh_consumer_key
        self.subsidiary = subsidiary or settings.ovh_subsidiary

        if not all([self.app_key, self.app_secret, self.consumer_key]):
            raise RuntimeError("OVH API credentials are not configured")

        self.client = ovh.Client(
            endpoint=self.endpoint,
            application_key=self.app_key,
            application_secret=self.app_secret,
            consumer_key=self.consumer_key,
        )

    def _track(self, method: str, path: str, status: str) -> None:
        OVH_API_CALL_COUNT.labels(method=method.upper(), status=status).inc()

    def get(self, path: str, **kwargs) -> Any:
        logger.info(f"OVH API GET {path} {kwargs}")
        try:
            result = self.client.get(path, **kwargs)
            self._track("GET", path, "ok")
            return result
        except Exception as e:
            self._track("GET", path, "error")
            raise e

    def post(self, path: str, **kwargs) -> Any:
        logger.info(f"OVH API POST {path} {kwargs}")
        try:
            result = self.client.post(path, **kwargs)
            self._track("POST", path, "ok")
            return result
        except Exception as e:
            self._track("POST", path, "error")
            raise e

    def put(self, path: str, **kwargs) -> Any:
        logger.info(f"OVH API PUT {path} {kwargs}")
        try:
            result = self.client.put(path, **kwargs)
            self._track("PUT", path, "ok")
            return result
        except Exception as e:
            self._track("PUT", path, "error")
            raise e

    def delete(self, path: str, **kwargs) -> Any:
        logger.info(f"OVH API DELETE {path} {kwargs}")
        try:
            result = self.client.delete(path, **kwargs)
            self._track("DELETE", path, "ok")
            return result
        except Exception as e:
            self._track("DELETE", path, "error")
            raise e

    def request(self, method: str, path: str, **kwargs) -> Any:
        """Generic request method used by other services."""
        if method.upper() == "GET":
            return self.get(path, **kwargs)
        elif method.upper() == "POST":
            return self.post(path, **kwargs)
        elif method.upper() == "PUT":
            return self.put(path, **kwargs)
        elif method.upper() == "DELETE":
            return self.delete(path, **kwargs)
        raise ValueError(f"Unsupported HTTP method: {method}")

    # ---------- Catalog ----------

    def get_public_catalog(self, service: str, subsidiary: Optional[str] = None) -> Dict[str, Any]:
        return self.get(
            f"/order/catalog/public/{service}",
            ovhSubsidiary=subsidiary or self.subsidiary,
        )

    # ---------- Cart lifecycle ----------

    def create_cart(self, description: str = "BelieVoo automated order", subsidiary: Optional[str] = None) -> Dict[str, Any]:
        return self.post(
            "/order/cart",
            ovhSubsidiary=subsidiary or self.subsidiary,
            description=description,
        )

    def assign_cart(self, cart_id: str) -> Dict[str, Any]:
        return self.post(f"/order/cart/{cart_id}/assign")

    def add_item_to_cart(self, cart_id: str, service: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.post(f"/order/cart/{cart_id}/{service}", **payload)

    def add_item_option(self, cart_id: str, service: str, parent_item_id: Any, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Add an option/addon to an existing cart item.

        OVH API uses the /{service}/options sub-endpoint and the parent item
        is referenced by 'itemId', not 'parentItemId'.
        """
        option_payload = {**payload, "itemId": parent_item_id}
        return self.post(f"/order/cart/{cart_id}/{service}/options", **option_payload)

    def configure_cart_item(self, cart_id: str, item_id: str, label: str, value: str) -> Dict[str, Any]:
        return self.post(
            f"/order/cart/{cart_id}/item/{item_id}/configuration",
            label=label,
            value=value,
        )

    def get_cart_checkout(self, cart_id: str) -> Dict[str, Any]:
        return self.get(f"/order/cart/{cart_id}/checkout")

    def post_cart_checkout(
        self,
        cart_id: str,
        auto_pay_with_preferred_payment_mean: bool = False,
        waive_retractation_period: bool = True,
    ) -> Dict[str, Any]:
        return self.post(
            f"/order/cart/{cart_id}/checkout",
            autoPayWithPreferredPaymentMethod=auto_pay_with_preferred_payment_mean,
            waiveRetractationPeriod=waive_retractation_period,
        )

    # ---------- Order / Payment ----------

    def get_order(self, order_id: int) -> Dict[str, Any]:
        return self.get(f"/me/order/{order_id}")

    def get_order_payment_means(self, order_id: int) -> List[Dict[str, Any]]:
        return self.get(f"/me/order/{order_id}/availableRegisteredPaymentMean")

    def pay_order_with_registered_payment_mean(
        self,
        order_id: int,
        payment_mean: str = "fidelityAccount",
        payment_mean_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"paymentMean": payment_mean}
        if payment_mean_id is not None:
            payload["paymentMeanId"] = payment_mean_id
        return self.post(f"/me/order/{order_id}/payWithRegisteredPaymentMean", **payload)

    def get_order_details(self, order_id: int) -> List[Dict[str, Any]]:
        return self.get(f"/me/order/{order_id}/details")

    # ---------- Service lookup ----------

    def get_vps(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/vps/{service_name}")

    def get_vps_ips(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/vps/{service_name}/ips")

    def get_dedicated_server(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/dedicated/server/{service_name}")

    def get_web_hosting(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/hosting/web/{service_name}")

    def get_domain(self, domain: str) -> Dict[str, Any]:
        return self.get(f"/domain/{domain}")

    def list_services(self) -> Dict[str, Any]:
        return self.get("/service")

    def get_me(self) -> Dict[str, Any]:
        return self.get("/me")

    # ---------- Server lifecycle ----------

    def reboot_vps(self, service_name: str) -> Dict[str, Any]:
        return self.post(f"/vps/{service_name}/reboot")

    def halt_vps(self, service_name: str) -> Dict[str, Any]:
        return self.post(f"/vps/{service_name}/reboot", type="halt")

    def start_vps(self, service_name: str) -> Dict[str, Any]:
        return self.post(f"/vps/{service_name}/start")

    def reboot_dedicated(self, service_name: str) -> Dict[str, Any]:
        return self.post(f"/dedicated/server/{service_name}/reboot")

    def terminate_service(self, service_name: str) -> Dict[str, Any]:
        return self.post(f"/service/{service_name}/terminate")

    # ---------- Public Cloud (project-scoped) ----------

    def list_cloud_projects(self) -> List[str]:
        return self.get("/cloud/project")

    def get_cloud_project(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/cloud/project/{service_name}")

    def create_cloud_project(self, description: str = "") -> Dict[str, Any]:
        return self.post("/cloud/createProject", description=description)

    def cloud_regions(self, service_name: str) -> List[str]:
        return self.get(f"/cloud/project/{service_name}/region")

    def cloud_flavors(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/flavor")

    def cloud_images(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/image")

    def cloud_sshkeys(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/sshkey")

    def cloud_create_sshkey(self, service_name: str, name: str, public_key: str, region: Optional[str] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"name": name, "publicKey": public_key}
        if region:
            payload["region"] = region
        return self.post(f"/cloud/project/{service_name}/sshkey", **payload)

    def cloud_delete_sshkey(self, service_name: str, key_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/sshkey/{key_id}")

    def cloud_instances(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/instance")

    def cloud_get_instance(self, service_name: str, instance_id: str) -> Dict[str, Any]:
        return self.get(f"/cloud/project/{service_name}/instance/{instance_id}")

    def cloud_create_instance(self, service_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/instance", **payload)

    def cloud_instance_action(self, service_name: str, instance_id: str, action: str, **kwargs) -> Any:
        return self.post(f"/cloud/project/{service_name}/instance/{instance_id}/{action}", **kwargs)

    def cloud_delete_instance(self, service_name: str, instance_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/instance/{instance_id}")

    def cloud_volumes(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/volume")

    def cloud_create_volume(self, service_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/volume", **payload)

    def cloud_volume_action(self, service_name: str, volume_id: str, action: str, **kwargs) -> Any:
        return self.post(f"/cloud/project/{service_name}/volume/{volume_id}/{action}", **kwargs)

    def cloud_delete_volume(self, service_name: str, volume_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/volume/{volume_id}")

    def cloud_volume_snapshot(self, service_name: str, volume_id: str, name: Optional[str] = None) -> Any:
        return self.post(f"/cloud/project/{service_name}/volume/{volume_id}/snapshot", name=name)

    def cloud_storage_containers(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/storage")

    def cloud_create_storage(self, service_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/storage", **payload)

    def cloud_delete_storage(self, service_name: str, container_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/storage/{container_id}")

    def cloud_floating_ips(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/ip/floating")

    def cloud_create_floating_ip(self, service_name: str, region: str, description: str = "") -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/ip/floating", region=region, description=description)

    def cloud_private_networks(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/network/private")

    def cloud_create_private_network(self, service_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/network/private", **payload)

    def cloud_quotas(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/cloud/project/{service_name}/quota")

    def cloud_usage(self, service_name: str) -> Dict[str, Any]:
        return self.get(f"/cloud/project/{service_name}/usage/current")

    # Managed Kubernetes

    def cloud_kubes(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/kube")

    def cloud_create_kube(self, service_name: str, name: str, region: str, version: Optional[str] = None, private_network_id: Optional[str] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"name": name, "region": region}
        if version:
            payload["version"] = version
        if private_network_id:
            payload["privateNetworkId"] = private_network_id
        return self.post(f"/cloud/project/{service_name}/kube", **payload)

    def cloud_delete_kube(self, service_name: str, kube_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/kube/{kube_id}")

    def cloud_kube_kubeconfig(self, service_name: str, kube_id: str) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/kube/{kube_id}/kubeconfig")

    # Managed Private Registry

    def cloud_registries(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/containerRegistry")

    def cloud_registry_plans(self, service_name: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/containerRegistry/plan")

    def cloud_create_registry(self, service_name: str, name: str, plan_id: str, region: str) -> Dict[str, Any]:
        return self.post(f"/cloud/project/{service_name}/containerRegistry", name=name, planID=plan_id, region=region)

    def cloud_delete_registry(self, service_name: str, registry_id: str) -> Any:
        return self.delete(f"/cloud/project/{service_name}/containerRegistry/{registry_id}")

    # Managed Databases

    def cloud_databases(self, service_name: str, engine: str) -> List[Dict[str, Any]]:
        return self.get(f"/cloud/project/{service_name}/database/{engine}")

    def cloud_database_capabilities(self, service_name: str, engine: str) -> Dict[str, Any]:
        return self.get(f"/cloud/project/{service_name}/capabilities/database/{engine}")


# ---------- Helpers ----------

def ovh_price_to_decimal(price: Optional[Any]) -> Decimal:
    """Extract a Decimal from OVH price object."""
    if price is None:
        return Decimal("0")
    if isinstance(price, dict):
        # Try formattedPrice first (most reliable)
        formatted = price.get("formattedPrice")
        if formatted:
            match = re.search(r"(\d+\.?\d*)", str(formatted).replace(",", ""))
            if match:
                return Decimal(match.group(1))
        # Try numeric price (OVH often stores price in micro-cents)
        numeric_price = price.get("price")
        if numeric_price is not None:
            try:
                val = Decimal(str(numeric_price))
                # If value looks like micro-cents (very large), convert to dollars
                if val > 100000:
                    return (val / Decimal("100000000")).quantize(Decimal("0.01"))
                return val
            except Exception:
                pass
        if price.get("value") is not None:
            return Decimal(str(price["value"]))
    if isinstance(price, (int, float)):
        return Decimal(str(price))
    return Decimal("0")


def apply_margin(base_price: Decimal, margin_percent: Decimal) -> Decimal:
    """Return base_price * (1 + margin_percent/100), rounded to 2 decimals."""
    multiplier = Decimal("1") + (margin_percent / Decimal("100"))
    return (base_price * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def log_ovh_step(
    db,
    order_id: str,
    step: str,
    endpoint: str,
    request_payload: Any,
    response_payload: Any,
    is_success: bool = True,
    error_message: Optional[str] = None,
):
    """Persist an OVH API audit log entry tied to a customer order."""
    log = OvhOrderLog(
        order_id=order_id,
        step=step,
        endpoint=endpoint,
        request_payload=request_payload,
        response_payload=response_payload,
        is_success=is_success,
        error_message=error_message,
    )
    db.add(log)
    db.commit()


def get_ovh_client_from_db(db) -> OvhClient:
    """Build an OVH client from environment or admin_configs table."""
    from app.models.models import AdminConfig

    settings = get_settings()
    configs = {c.key: c.value for c in db.query(AdminConfig).all()}
    return OvhClient(
        endpoint=configs.get("ovh_endpoint") or settings.ovh_endpoint,
        app_key=configs.get("ovh_application_key") or settings.ovh_application_key,
        app_secret=configs.get("ovh_application_secret") or settings.ovh_application_secret,
        consumer_key=configs.get("ovh_consumer_key") or settings.ovh_consumer_key,
        subsidiary=configs.get("ovh_subsidiary") or settings.ovh_subsidiary,
    )
