import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import * as paymentService from "../../services/payment-service.js";
import * as posterService from "../../services/poster-service.js";

const stripeWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /webhooks/stripe — Stripe signature verification (raw body)
  fastify.post(
    "/webhooks/stripe",
    {
      config: {
        // Disable body parsing so we get the raw body for signature verification
        rawBody: true,
      },
    },
    async (request, reply) => {
      const signature = request.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        return reply.status(400).send({
          error: {
            code: "MISSING_SIGNATURE",
            message: "Missing stripe-signature header",
          },
        });
      }

      const stripeKey = (fastify as { stripeSecretKey?: string })
        .stripeSecretKey;
      const webhookSecret = (fastify as { stripeWebhookSecret?: string })
        .stripeWebhookSecret;

      if (!stripeKey || !webhookSecret) {
        throw new Error("Stripe keys not configured");
      }

      const provider = paymentService.createStripeProvider(stripeKey);

      let event: unknown;
      try {
        const rawBody =
          (request as { rawBody?: string | Buffer }).rawBody ??
          JSON.stringify(request.body);
        const bodyStr =
          typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
        event = provider.constructWebhookEvent(bodyStr, signature, webhookSecret);
      } catch (err) {
        return reply.status(400).send({
          error: {
            code: "INVALID_SIGNATURE",
            message: "Stripe signature verification failed",
          },
        });
      }

      const stripeEvent = event as {
        type: string;
        data: { object: { id?: string } };
      };

      if (stripeEvent.type === "payment_intent.succeeded") {
        const paymentIntentId = stripeEvent.data.object.id;

        if (!paymentIntentId) {
          return reply.status(400).send({
            error: {
              code: "INVALID_EVENT",
              message: "Missing payment intent id in event",
            },
          });
        }

        // Handle payment success
        const orderId = await paymentService.handlePaymentSuccess(
          fastify.db,
          paymentIntentId
        );

        // Push to Poster POS
        const posterApiUrl = (fastify as { posterApiUrl?: string })
          .posterApiUrl;
        const posterAccessToken = (fastify as { posterAccessToken?: string })
          .posterAccessToken;

        if (posterApiUrl && posterAccessToken) {
          const posterProvider = posterService.createRealPosterProvider(
            posterApiUrl,
            posterAccessToken
          );

          try {
            await posterService.pushOrderToPoster(
              fastify.db,
              posterProvider,
              orderId
            );
          } catch (err) {
            // Log but don't fail the webhook response — Stripe would retry
            fastify.log.error(
              { err, orderId },
              "Failed to push order to Poster"
            );
          }
        }
      }

      return reply.status(200).send({ received: true });
    }
  );
};

export default fp(stripeWebhookRoutes, {
  name: "stripe-webhook-routes",
  fastify: "5.x",
});
