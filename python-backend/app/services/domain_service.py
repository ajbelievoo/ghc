from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.models import DomainRegistration, DomainStatus
from app.services.ovh_client import OvhClient


def _verify_domain_owner(db: Session, user_id: str, full_domain: str) -> Optional[DomainRegistration]:
    """Verify the user owns this domain in the GHC database."""
    parts = full_domain.lower().split(".")
    if len(parts) < 2:
        return None
    name = parts[0]
    tld = ".".join(parts[1:])
    reg = db.query(DomainRegistration).filter(
        DomainRegistration.user_id == user_id,
        DomainRegistration.domain_name == name,
        DomainRegistration.tld == tld,
    ).first()
    if reg and reg.status == DomainStatus.ACTIVE:
        return reg
    return None


def list_dns_records(ovh: OvhClient, full_domain: str) -> List[Dict[str, Any]]:
    """List DNS records for a domain zone."""
    try:
        record_ids = ovh.get(f"/domain/zone/{full_domain}/record") or []
    except Exception as e:
        raise ValueError(f"Unable to read DNS zone: {e}")
    records = []
    for rid in record_ids:
        try:
            r = ovh.get(f"/domain/zone/{full_domain}/record/{rid}")
            records.append({
                "id": r.get("id"),
                "recordType": r.get("fieldType"),
                "subDomain": r.get("subDomain") or "@",
                "target": r.get("target"),
                "ttl": r.get("ttl"),
            })
        except Exception:
            pass
    # Sort: apex first, then by type and subdomain
    return sorted(records, key=lambda x: (x["subDomain"] != "@", x["recordType"], x["subDomain"]))


def create_dns_record(
    ovh: OvhClient,
    full_domain: str,
    record_type: str,
    sub_domain: str,
    target: str,
    ttl: int = 3600,
) -> Dict[str, Any]:
    """Create a DNS record in the OVH zone."""
    try:
        result = ovh.post(
            f"/domain/zone/{full_domain}/record",
            fieldType=record_type.upper(),
            subDomain=sub_domain if sub_domain and sub_domain != "@" else "",
            target=target,
            ttl=int(ttl),
        )
        return {"success": True, "recordId": result.get("id"), "domain": full_domain}
    except Exception as e:
        raise ValueError(f"Failed to create DNS record: {e}")


def update_dns_record(
    ovh: OvhClient,
    full_domain: str,
    record_id: int,
    sub_domain: Optional[str] = None,
    target: Optional[str] = None,
    ttl: Optional[int] = None,
) -> Dict[str, Any]:
    """Update a DNS record."""
    try:
        payload: Dict[str, Any] = {}
        if sub_domain is not None:
            payload["subDomain"] = sub_domain if sub_domain and sub_domain != "@" else ""
        if target is not None:
            payload["target"] = target
        if ttl is not None:
            payload["ttl"] = int(ttl)
        ovh.put(f"/domain/zone/{full_domain}/record/{record_id}", **payload)
        return {"success": True, "recordId": record_id, "domain": full_domain}
    except Exception as e:
        raise ValueError(f"Failed to update DNS record: {e}")


def delete_dns_record(ovh: OvhClient, full_domain: str, record_id: int) -> Dict[str, Any]:
    """Delete a DNS record."""
    try:
        ovh.delete(f"/domain/zone/{full_domain}/record/{record_id}")
        return {"success": True, "recordId": record_id, "domain": full_domain}
    except Exception as e:
        raise ValueError(f"Failed to delete DNS record: {e}")


def refresh_dns_zone(ovh: OvhClient, full_domain: str) -> Dict[str, Any]:
    """Apply DNS zone changes."""
    try:
        ovh.post(f"/domain/zone/{full_domain}/refresh")
        return {"success": True, "domain": full_domain}
    except Exception as e:
        raise ValueError(f"Failed to refresh DNS zone: {e}")
