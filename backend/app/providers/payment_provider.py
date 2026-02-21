"""Payment provider — protocol + Stripe + mock implementations."""

from typing import Protocol

import stripe

from app.config import settings


class PaymentResult:
    def __init__(
        self,
        payment_intent_id: str,
        client_secret: str,
        status: str = "requires_payment_method",
    ) -> None:
        self.payment_intent_id = payment_intent_id
        self.client_secret = client_secret
        self.status = status


class PaymentProvider(Protocol):
    async def create_payment_intent(
        self, amount_cents: int, currency: str, metadata: dict
    ) -> PaymentResult: ...

    def verify_webhook_signature(
        self, payload: bytes, sig_header: str
    ) -> dict: ...


class StripePaymentProvider:
    def __init__(self) -> None:
        stripe.api_key = settings.stripe_secret_key

    async def create_payment_intent(
        self, amount_cents: int, currency: str, metadata: dict
    ) -> PaymentResult:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            metadata=metadata,
        )
        return PaymentResult(
            payment_intent_id=intent.id,
            client_secret=intent.client_secret,
            status=intent.status,
        )

    def verify_webhook_signature(
        self, payload: bytes, sig_header: str
    ) -> dict:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
        return dict(event)


_counter = 0


class MockPaymentProvider:
    async def create_payment_intent(
        self, amount_cents: int, currency: str, metadata: dict
    ) -> PaymentResult:
        global _counter
        _counter += 1
        return PaymentResult(
            payment_intent_id=f"pi_mock_{_counter}",
            client_secret=f"secret_mock_{_counter}",
            status="requires_payment_method",
        )

    def verify_webhook_signature(
        self, payload: bytes, sig_header: str
    ) -> dict:
        import json

        return json.loads(payload)


def get_payment_provider() -> PaymentProvider:
    if settings.environment == "test":
        return MockPaymentProvider()  # type: ignore[return-value]
    return StripePaymentProvider()  # type: ignore[return-value]
