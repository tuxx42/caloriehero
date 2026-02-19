import {
  pgTable,
  uuid,
  varchar,
  real,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  radiusKm: real("radius_km").notNull(),
  deliveryFee: real("delivery_fee").notNull().default(0),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliverySlots = pgTable("delivery_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: varchar("date", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  zoneId: uuid("zone_id")
    .references(() => deliveryZones.id)
    .notNull(),
  capacity: integer("capacity").notNull(),
  bookedCount: integer("booked_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DeliveryZoneRow = typeof deliveryZones.$inferSelect;
export type NewDeliveryZoneRow = typeof deliveryZones.$inferInsert;
export type DeliverySlotRow = typeof deliverySlots.$inferSelect;
export type NewDeliverySlotRow = typeof deliverySlots.$inferInsert;
