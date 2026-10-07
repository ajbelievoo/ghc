from datetime import datetime


def format_datetime(dt: datetime) -> str:
    if dt is None:
        return None
    return dt.isoformat()
