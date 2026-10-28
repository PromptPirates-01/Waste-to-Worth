import logging
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler

from .config import ALERT_DAYS_BEFORE, ALERT_HOUR, SMTP_USER, TZ
from .db import admin
from .emailer import send

log = logging.getLogger("w2w.alerts")


def run_expiry_alerts() -> int:
    """Email each home user one digest per day for items expiring soon (or expired yesterday)."""
    today = datetime.now(ZoneInfo(TZ)).date()
    rows = (
        admin.table("food_items")
        .select("id,name,quantity,expiry_date,last_alerted_on,user_id,profiles(email,full_name)")
        .gte("expiry_date", (today - timedelta(days=1)).isoformat())
        .lte("expiry_date", (today + timedelta(days=ALERT_DAYS_BEFORE)).isoformat())
        .execute()
        .data
    )
    by_user = defaultdict(list)
    for r in rows:
        if r.get("last_alerted_on") != today.isoformat():
            by_user[r["user_id"]].append(r)
    sent = 0
    for items in by_user.values():
        prof = items[0]["profiles"]
        lines = []
        for i in sorted(items, key=lambda x: x["expiry_date"]):
            d = (datetime.fromisoformat(i["expiry_date"]).date() - today).days
            when = "expired yesterday" if d < 0 else "expires today" if d == 0 else f"expires in {d} day(s)"
            lines.append(f"- {i['name']} ({i['quantity']}): {when} [{i['expiry_date']}]")
        body = (
            f"Hi {prof.get('full_name') or 'there'},\n\nThese items in My Home need attention:\n\n"
            + "\n".join(lines)
            + "\n\nUse them first, share or donate extras, and compost what can't be saved.\n\n- Waste to Worth"
        )
        try:
            send(prof["email"], "Food expiring soon - Waste to Worth", body)
            for i in items:
                admin.table("food_items").update({"last_alerted_on": today.isoformat()}).eq("id", i["id"]).execute()
            sent += 1
        except Exception:
            log.exception("Could not email %s", prof["email"])
    return sent


def start_scheduler() -> BackgroundScheduler:
    sched = BackgroundScheduler(timezone=TZ)
    if SMTP_USER:
        sched.add_job(run_expiry_alerts, "cron", hour=ALERT_HOUR, minute=0, id="expiry_alerts")
    else:
        log.warning("SMTP_USER not set: expiry email alerts are disabled")
    sched.start()
    return sched
