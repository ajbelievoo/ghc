import json
import logging
import os
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, Optional

import requests
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.models import AdminConfig

logger = logging.getLogger(__name__)

DEFAULT_BASE = "INR"
DEFAULT_TARGETS = (
    "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "CNY", "HKD", "NZD",
    "CHF", "SEK", "NOK", "DKK", "PLN", "AED", "SAR", "BRL", "MXN", "ZAR",
    "KRW", "PHP", "THB", "MYR", "IDR", "VND", "TRY", "RUB", "PKR", "BDT"
)

# Fallback rates (rough) so the site never breaks if the API is down.
FALLBACK_RATES: Dict[str, float] = {
    "USD": 0.01195,
    "EUR": 0.01105,
    "GBP": 0.00925,
    "CAD": 0.01635,
    "AUD": 0.01805,
    "SGD": 0.01595,
    "JPY": 1.83,
    "CNY": 0.0865,
    "HKD": 0.0935,
    "NZD": 0.01955,
    "CHF": 0.01065,
    "SEK": 0.129,
    "NOK": 0.129,
    "DKK": 0.0825,
    "PLN": 0.0475,
    "AED": 0.0439,
    "SAR": 0.0448,
    "BRL": 0.0665,
    "MXN": 0.239,
    "ZAR": 0.215,
    "KRW": 16.3,
    "PHP": 0.695,
    "THB": 0.415,
    "MYR": 0.055,
    "IDR": 189.5,
    "VND": 302.5,
    "TRY": 0.389,
    "RUB": 1.06,
    "PKR": 3.32,
    "BDT": 1.42,
}


def _rate_key(base: str, target: str) -> str:
    return f"rate:{base}:{target}"


def _get_cached_rate(db: Session, base: str, target: str) -> Optional[float]:
    cfg = db.query(AdminConfig).filter(AdminConfig.key == _rate_key(base, target)).first()
    if not cfg:
        return None
    try:
        value = json.loads(cfg.value)
        updated = datetime.fromisoformat(value["updated"])
        if datetime.utcnow() - updated > timedelta(hours=1):
            return None
        return float(value["rate"])
    except Exception:
        return None


def _set_cached_rate(db: Session, base: str, target: str, rate: float) -> None:
    cfg = db.query(AdminConfig).filter(AdminConfig.key == _rate_key(base, target)).first()
    payload = json.dumps({"rate": float(rate), "updated": datetime.utcnow().isoformat()})
    if not cfg:
        cfg = AdminConfig(key=_rate_key(base, target), value=payload)
        db.add(cfg)
    else:
        cfg.value = payload
    db.commit()


def _fetch_rates(base: str) -> Dict[str, float]:
    """Fetch exchange rates from a free public API."""
    # Try exchangerate-api (no API key required for the open endpoint)
    try:
        resp = requests.get(f"https://api.exchangerate-api.com/v4/latest/{base}", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {k: float(v) for k, v in data.get("rates", {}).items() if isinstance(v, (int, float))}
    except Exception as e:
        logger.warning(f"exchangerate-api failed: {e}")

    # Fallback to open.er-api
    try:
        resp = requests.get(f"https://open.er-api.com/v6/latest/{base}", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {k: float(v) for k, v in data.get("rates", {}).items() if isinstance(v, (int, float))}
    except Exception as e:
        logger.warning(f"open.er-api failed: {e}")

    return {}


def get_rate(db: Session, base: str, target: str) -> float:
    """Return the exchange rate from base to target, updating cache if needed."""
    base = (base or DEFAULT_BASE).upper()
    target = (target or DEFAULT_BASE).upper()
    if base == target:
        return 1.0

    # Check cache
    cached = _get_cached_rate(db, base, target)
    if cached:
        return cached

    # Try to get cross-rate via USD if direct not cached
    if base != "USD" and target != "USD":
        usd_to_base = _get_cached_rate(db, "USD", base) or _get_cached_rate(db, base, "USD")
        usd_to_target = _get_cached_rate(db, "USD", target) or _get_cached_rate(db, target, "USD")
        if usd_to_base and usd_to_target:
            return float(Decimal(str(usd_to_target)) / Decimal(str(usd_to_base)))

    # Fetch from API
    rates = _fetch_rates(base)
    if target in rates:
        _set_cached_rate(db, base, target, rates[target])
        return rates[target]

    # If target not in fetched rates, try to compute cross via USD
    if "USD" in rates:
        _set_cached_rate(db, base, "USD", rates["USD"])
        rates_usd = _fetch_rates("USD")
        if target in rates_usd:
            cross = float(Decimal(str(rates_usd[target])) / Decimal(str(rates["USD"])))
            _set_cached_rate(db, base, target, cross)
            return cross

    # Fallback to hardcoded approximate rates (base is assumed INR)
    if base == DEFAULT_BASE and target in FALLBACK_RATES:
        return FALLBACK_RATES[target]

    # Last resort: target not available, return 1.0 so the UI still shows a number
    logger.warning(f"No exchange rate for {base} -> {target}; returning 1.0")
    return 1.0


def convert(db: Session, amount: Optional[Any], from_currency: str, to_currency: str) -> float:
    """Convert an amount from one currency to another."""
    if amount is None:
        return 0.0
    from_currency = (from_currency or DEFAULT_BASE).upper()
    to_currency = (to_currency or DEFAULT_BASE).upper()
    if from_currency == to_currency:
        return float(amount)
    try:
        rate = get_rate(db, from_currency, to_currency)
        return float(Decimal(str(amount)) * Decimal(str(rate)))
    except Exception:
        return float(amount)


def format_money(amount: float, currency: str) -> str:
    """Format a number as a money string for the given currency."""
    symbols = {
        "USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", "AUD": "A$",
        "SGD": "S$", "JPY": "¥", "CNY": "¥", "HKD": "HK$", "NZD": "NZ$",
        "CHF": "CHF", "SEK": "kr", "NOK": "kr", "DKK": "kr", "PLN": "zł",
        "AED": "AED", "SAR": "SAR", "BRL": "R$", "MXN": "MX$", "ZAR": "R",
        "KRW": "₩", "PHP": "₱", "THB": "฿", "MYR": "RM", "IDR": "Rp",
        "VND": "₫", "TRY": "₺", "RUB": "₽", "PKR": "₨", "BDT": "৳",
        "INR": "₹",
    }
    sym = symbols.get((currency or "").upper(), currency or "")
    val = float(amount or 0)
    # Use 2 decimals for most, 0 for zero-decimal currencies
    curr = (currency or "").upper()
    decimals = 0 if curr in ("JPY", "KRW", "IDR", "VND") else 2
    formatted = f"{val:,.{decimals}f}"
    return f"{sym}{formatted}"


def available_currencies() -> list:
    return list(DEFAULT_TARGETS)
