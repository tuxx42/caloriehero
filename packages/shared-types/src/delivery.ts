import { z } from "zod";

// ---------------------------------------------------------------------------
// Delivery zone
// ---------------------------------------------------------------------------

export const deliveryZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().describe("Human-readable zone name, e.g. 'Sukhumvit'"),
  lat: z
    .number()
    .describe("Latitude of the zone centre point"),
  lng: z
    .number()
    .describe("Longitude of the zone centre point"),
  radiusKm: z
    .number()
    .positive()
    .describe("Delivery radius from the centre point in kilometres"),
  deliveryFee: z
    .number()
    .nonnegative()
    .describe("Delivery fee in THB for orders within this zone"),
  active: z
    .boolean()
    .default(true)
    .describe("Whether this zone is currently accepting orders"),
});

export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;

// ---------------------------------------------------------------------------
// Delivery slot
// ---------------------------------------------------------------------------

export const deliverySlotSchema = z.object({
  id: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date string (YYYY-MM-DD)")
    .describe("The calendar date of this delivery slot"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be in HH:mm format")
    .describe("Slot start time in HH:mm (local time)"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Must be in HH:mm format")
    .describe("Slot end time in HH:mm (local time)"),
  zoneId: z.string().uuid(),
  capacity: z
    .number()
    .int()
    .positive()
    .describe("Maximum number of orders this slot can accommodate"),
  bookedCount: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe("Number of orders currently booked into this slot"),
});

export type DeliverySlot = z.infer<typeof deliverySlotSchema>;
