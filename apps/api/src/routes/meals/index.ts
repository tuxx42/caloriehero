import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import {
  createMealRequestSchema,
  updateMealRequestSchema,
} from "@caloriehero/shared-types";
import { requireAdmin } from "../../middleware/require-admin.js";
import * as mealService from "../../services/meal-service.js";

const mealRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/meals — public
  fastify.get("/api/v1/meals", async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const category = query["category"];
    const activeParam = query["active"];
    const active =
      activeParam === undefined ? undefined : activeParam !== "false";

    const mealsList = await mealService.listMeals(fastify.db, {
      category,
      active,
    });
    return { meals: mealsList };
  });

  // GET /api/v1/meals/:id — public
  fastify.get<{ Params: { id: string } }>(
    "/api/v1/meals/:id",
    async (request, reply) => {
      const meal = await mealService.getMeal(fastify.db, request.params.id);
      if (!meal) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Meal not found" },
        });
      }
      return meal;
    }
  );

  // POST /api/v1/meals — admin only
  fastify.post(
    "/api/v1/meals",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = createMealRequestSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Request validation failed",
              details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          });
        }
        throw err;
      }

      const meal = await mealService.createMeal(fastify.db, {
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        calories: parsed.nutritionalInfo.calories,
        protein: parsed.nutritionalInfo.protein,
        carbs: parsed.nutritionalInfo.carbs,
        fat: parsed.nutritionalInfo.fat,
        fiber: parsed.nutritionalInfo.fiber ?? null,
        sugar: parsed.nutritionalInfo.sugar ?? null,
        servingSize: parsed.servingSize,
        price: parsed.price,
        allergens: parsed.allergens,
        dietaryTags: parsed.dietaryTags,
        imageUrl: parsed.imageUrl ?? null,
        posterProductId: parsed.posterProductId ?? null,
        active: true,
      });

      return reply.status(201).send(meal);
    }
  );

  // PUT /api/v1/meals/:id — admin only
  fastify.put<{ Params: { id: string } }>(
    "/api/v1/meals/:id",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      let parsed;
      try {
        parsed = updateMealRequestSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Request validation failed",
              details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          });
        }
        throw err;
      }

      const updateData: mealService.UpdateMealData = {};
      if (parsed.name !== undefined) updateData.name = parsed.name;
      if (parsed.description !== undefined)
        updateData.description = parsed.description;
      if (parsed.category !== undefined) updateData.category = parsed.category;
      if (parsed.servingSize !== undefined)
        updateData.servingSize = parsed.servingSize;
      if (parsed.price !== undefined) updateData.price = parsed.price;
      if (parsed.allergens !== undefined)
        updateData.allergens = parsed.allergens;
      if (parsed.dietaryTags !== undefined)
        updateData.dietaryTags = parsed.dietaryTags;
      if (parsed.imageUrl !== undefined)
        updateData.imageUrl = parsed.imageUrl ?? null;
      if (parsed.posterProductId !== undefined)
        updateData.posterProductId = parsed.posterProductId ?? null;
      if (parsed.nutritionalInfo !== undefined) {
        if (parsed.nutritionalInfo.calories !== undefined)
          updateData.calories = parsed.nutritionalInfo.calories;
        if (parsed.nutritionalInfo.protein !== undefined)
          updateData.protein = parsed.nutritionalInfo.protein;
        if (parsed.nutritionalInfo.carbs !== undefined)
          updateData.carbs = parsed.nutritionalInfo.carbs;
        if (parsed.nutritionalInfo.fat !== undefined)
          updateData.fat = parsed.nutritionalInfo.fat;
        if (parsed.nutritionalInfo.fiber !== undefined)
          updateData.fiber = parsed.nutritionalInfo.fiber ?? null;
        if (parsed.nutritionalInfo.sugar !== undefined)
          updateData.sugar = parsed.nutritionalInfo.sugar ?? null;
      }

      const meal = await mealService.updateMeal(
        fastify.db,
        request.params.id,
        updateData
      );
      if (!meal) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Meal not found" },
        });
      }
      return meal;
    }
  );

  // DELETE /api/v1/meals/:id — admin only (soft delete)
  fastify.delete<{ Params: { id: string } }>(
    "/api/v1/meals/:id",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const meal = await mealService.deleteMeal(fastify.db, request.params.id);
      if (!meal) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Meal not found" },
        });
      }
      return reply.status(200).send(meal);
    }
  );
};

export default fp(mealRoutes, {
  name: "meal-routes",
  fastify: "5.x",
});
