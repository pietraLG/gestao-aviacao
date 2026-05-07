import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Aircraft table - Tipos de aeronaves disponíveis
 */
export const aircraft = mysqlTable("aircraft", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Ex: "Boeing 737"
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(),
  totalSeats: int("totalSeats").notNull(),
  seatConfiguration: text("seatConfiguration").notNull(), // JSON: {rows: 30, seatsPerRow: 6, layout: "ABCDEF"}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aircraft = typeof aircraft.$inferSelect;
export type InsertAircraft = typeof aircraft.$inferInsert;

/**
 * Flights table - Voos cadastrados
 */
export const flights = mysqlTable("flights", {
  id: int("id").autoincrement().primaryKey(),
  flightNumber: varchar("flightNumber", { length: 20 }).notNull().unique(),
  aircraftId: int("aircraftId").notNull(),
  origin: varchar("origin", { length: 50 }).notNull(), // IATA code: LIS, NYC, etc
  destination: varchar("destination", { length: 50 }).notNull(),
  departureTime: timestamp("departureTime").notNull(),
  arrivalTime: timestamp("arrivalTime").notNull(),
  pricePerSeat: int("pricePerSeat").notNull(), // Em centavos (ex: 15000 = 150€)
  status: mysqlEnum("status", ["scheduled", "boarding", "departed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

/**
 * Seats table - Assentos de cada voo
 */
export const seats = mysqlTable("seats", {
  id: int("id").autoincrement().primaryKey(),
  flightId: int("flightId").notNull(),
  seatNumber: varchar("seatNumber", { length: 10 }).notNull(), // Ex: "12A", "15F"
  row: int("row").notNull(),
  column: varchar("column", { length: 1 }).notNull(), // A, B, C, etc
  status: mysqlEnum("status", ["available", "occupied", "reserved"]).default("available").notNull(),
  seatClass: mysqlEnum("seatClass", ["economy", "business", "first"]).default("economy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

/**
 * Bookings table - Reservas de passageiros
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingCode: varchar("bookingCode", { length: 10 }).notNull().unique(), // Ex: "BK123ABC"
  userId: int("userId").notNull(),
  flightId: int("flightId").notNull(),
  seatId: int("seatId").notNull(),
  passengerName: varchar("passengerName", { length: 255 }).notNull(),
  passengerEmail: varchar("passengerEmail", { length: 320 }).notNull(),
  totalPrice: int("totalPrice").notNull(), // Em centavos
  status: mysqlEnum("status", ["confirmed", "cancelled", "completed"]).default("confirmed").notNull(),
  bookingDate: timestamp("bookingDate").defaultNow().notNull(),
  cancellationDate: timestamp("cancellationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;