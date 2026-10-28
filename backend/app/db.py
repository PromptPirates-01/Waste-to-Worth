from supabase import create_client
from .config import SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL

# Service-role client: server only. Never expose this key to the frontend.
admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def anon_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
