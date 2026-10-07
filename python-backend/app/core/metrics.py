"""Prometheus metrics for the GHC backend."""

from prometheus_client import Counter, Histogram, Info, generate_latest

APP_INFO = Info("ghc_app", "GHC application information")
APP_INFO.info({"version": "1.0.0"})

REQUEST_COUNT = Counter(
    "ghc_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "ghc_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
)

PAYMENT_WEBHOOK_COUNT = Counter(
    "ghc_payment_webhooks_total",
    "Payment webhooks received",
    ["gateway", "status"],
)

OVH_API_CALL_COUNT = Counter(
    "ghc_ovh_api_calls_total",
    "OVH API calls",
    ["method", "status"],
)

ORDER_COUNT = Counter(
    "ghc_orders_total",
    "Customer orders",
    ["category", "status"],
)


def metrics_response() -> bytes:
    """Return Prometheus exposition format metrics."""
    return generate_latest()
