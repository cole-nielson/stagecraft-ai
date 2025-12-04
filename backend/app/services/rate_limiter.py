import redis
from datetime import datetime, timedelta
from ..core.config import settings

# Rate limit settings
USER_DAILY_LIMIT = 10  # 10 generations per user per day
GLOBAL_DAILY_LIMIT = 30  # 30 total generations per day


class RateLimiter:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)

    def _get_today_key(self, prefix: str) -> str:
        """Get a key with today's date for daily reset."""
        today = datetime.now().strftime("%Y-%m-%d")
        return f"{prefix}:{today}"

    def check_user_limit(self, client_ip: str) -> tuple[bool, int]:
        """
        Check if user (by IP) has exceeded daily limit.
        Returns (allowed, remaining_count).
        """
        key = self._get_today_key(f"ratelimit:user:{client_ip}")

        current = self.redis.get(key)
        current_count = int(current) if current else 0

        if current_count >= USER_DAILY_LIMIT:
            return False, 0

        return True, USER_DAILY_LIMIT - current_count

    def check_global_limit(self) -> tuple[bool, int]:
        """
        Check if global daily limit has been exceeded.
        Returns (allowed, remaining_count).
        """
        key = self._get_today_key("ratelimit:global")

        current = self.redis.get(key)
        current_count = int(current) if current else 0

        if current_count >= GLOBAL_DAILY_LIMIT:
            return False, 0

        return True, GLOBAL_DAILY_LIMIT - current_count

    def increment_usage(self, client_ip: str) -> None:
        """Increment both user and global counters."""
        today = datetime.now().strftime("%Y-%m-%d")

        # User counter
        user_key = f"ratelimit:user:{client_ip}:{today}"
        pipe = self.redis.pipeline()
        pipe.incr(user_key)
        pipe.expire(user_key, 86400)  # 24 hours TTL

        # Global counter
        global_key = f"ratelimit:global:{today}"
        pipe.incr(global_key)
        pipe.expire(global_key, 86400)  # 24 hours TTL

        pipe.execute()

    def get_usage_stats(self, client_ip: str) -> dict:
        """Get current usage statistics."""
        today = datetime.now().strftime("%Y-%m-%d")

        user_key = f"ratelimit:user:{client_ip}:{today}"
        global_key = f"ratelimit:global:{today}"

        user_count = int(self.redis.get(user_key) or 0)
        global_count = int(self.redis.get(global_key) or 0)

        return {
            "user_used": user_count,
            "user_remaining": max(0, USER_DAILY_LIMIT - user_count),
            "user_limit": USER_DAILY_LIMIT,
            "global_used": global_count,
            "global_remaining": max(0, GLOBAL_DAILY_LIMIT - global_count),
            "global_limit": GLOBAL_DAILY_LIMIT,
        }


# Singleton instance
rate_limiter = RateLimiter()
