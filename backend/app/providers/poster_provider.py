"""Poster POS provider — protocol + real (httpx) + mock."""

from typing import Protocol

# Poster status → CalorieHero status mapping
POSTER_STATUS_MAP = {
    "new": "preparing",
    "accepted": "preparing",
    "cooking": "preparing",
    "ready": "ready",
    "delivering": "delivering",
    "delivered": "delivered",
    "cancelled": "cancelled",
}


class PosterProvider(Protocol):
    async def create_order(
        self, order_data: dict
    ) -> str:
        """Push order to Poster POS. Returns poster_order_id."""
        ...

    async def get_order_status(
        self, poster_order_id: str
    ) -> str | None:
        """Get order status from Poster. Returns mapped status string."""
        ...


class RealPosterProvider:
    def __init__(self, api_url: str, access_token: str) -> None:
        self.api_url = api_url
        self.access_token = access_token

    async def create_order(self, order_data: dict) -> str:
        import httpx

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.api_url}/order.createOrder",
                params={"token": self.access_token},
                json=order_data,
            )
            resp.raise_for_status()
            data = resp.json()
            return str(data.get("response", {}).get("order_id", ""))

    async def get_order_status(self, poster_order_id: str) -> str | None:
        import httpx

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.api_url}/order.getOrder",
                params={
                    "token": self.access_token,
                    "order_id": poster_order_id,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            poster_status = (
                data.get("response", {}).get("status", "")
            )
            return POSTER_STATUS_MAP.get(poster_status)


class MockPosterProvider:
    def __init__(self) -> None:
        self._orders: dict[str, str] = {}
        self._counter = 0

    async def create_order(self, order_data: dict) -> str:
        self._counter += 1
        order_id = f"poster_mock_{self._counter}"
        self._orders[order_id] = "new"
        return order_id

    async def get_order_status(self, poster_order_id: str) -> str | None:
        poster_status = self._orders.get(poster_order_id)
        if poster_status is None:
            return None
        return POSTER_STATUS_MAP.get(poster_status)

    def set_status(self, poster_order_id: str, status: str) -> None:
        """Test helper to simulate status changes."""
        self._orders[poster_order_id] = status
