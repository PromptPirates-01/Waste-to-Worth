import os
from dotenv import load_dotenv

load_dotenv()


def _req(key: str) -> str:
    v = os.getenv(key)
    if not v:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return v


SUPABASE_URL = _req("SUPABASE_URL")
SUPABASE_ANON_KEY = _req("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = _req("SUPABASE_SERVICE_KEY")
ANTHROPIC_API_KEY = _req("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

ALERT_DAYS_BEFORE = int(os.getenv("ALERT_DAYS_BEFORE", "3"))
ALERT_HOUR = int(os.getenv("ALERT_HOUR", "8"))
TZ = os.getenv("TIMEZONE", "Asia/Kolkata")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

# Token economy: 50 tokens = Rs 5  ->  10 tokens = Rs 1
TOKENS_BOTTLE = 10
TOKENS_DONATION = 20
TOKENS_PER_RUPEE = 10
MAX_BOTTLE_PER_DAY = 10
