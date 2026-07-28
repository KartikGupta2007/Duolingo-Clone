"""Single source of truth for "now".

SQLite does not store timezones, so an aware datetime written to the DB comes
back naive and then blows up when compared against an aware `now()`. To avoid
that entire class of bug we store *naive UTC* everywhere and only ever read the
clock through these two helpers.
"""

from datetime import date, datetime, timezone


def utcnow() -> datetime:
    """Current UTC time as a naive datetime (matches what SQLite gives back)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def today() -> date:
    """Current UTC date. Used for streak comparisons."""
    return utcnow().date()
