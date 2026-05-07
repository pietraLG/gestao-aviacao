import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, aircraft, flights, seats, bookings, Flight, Seat, Booking, Aircraft } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AIRCRAFT QUERIES
// ============================================================================

export async function createAircraft(data: {
  name: string;
  manufacturer: string;
  totalSeats: number;
  seatConfiguration: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aircraft).values(data);
  return result;
}

export async function getAircraftById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(aircraft).where(eq(aircraft.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAircraft() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(aircraft);
}

// ============================================================================
// FLIGHTS QUERIES
// ============================================================================

export async function createFlight(data: {
  flightNumber: string;
  aircraftId: number;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  pricePerSeat: number;
  status?: "scheduled" | "boarding" | "departed" | "cancelled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(flights).values(data);
  return result;
}

export async function getFlightById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(flights).where(eq(flights.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFlightByNumber(flightNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(flights).where(eq(flights.flightNumber, flightNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchFlights(origin: string, destination: string, departureDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Busca voos no mesmo dia
  const startOfDay = new Date(departureDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(departureDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(flights)
    .where(
      and(
        eq(flights.origin, origin),
        eq(flights.destination, destination),
        gte(flights.departureTime, startOfDay),
        lte(flights.departureTime, endOfDay),
        eq(flights.status, "scheduled")
      )
    )
    .orderBy(flights.departureTime);
}

export async function getAllFlights() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(flights).orderBy(desc(flights.departureTime));
}

export async function updateFlightStatus(flightId: number, status: "scheduled" | "boarding" | "departed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(flights).set({ status }).where(eq(flights.id, flightId));
}

// ============================================================================
// SEATS QUERIES
// ============================================================================

export async function createSeats(seatData: Array<{
  flightId: number;
  seatNumber: string;
  row: number;
  column: string;
  status?: "available" | "occupied" | "reserved";
  seatClass?: "economy" | "business" | "first";
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(seats).values(seatData);
}

export async function getFlightSeats(flightId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(seats).where(eq(seats.flightId, flightId));
}

export async function getSeatById(seatId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(seats).where(eq(seats.id, seatId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSeatStatus(seatId: number, status: "available" | "occupied" | "reserved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(seats).set({ status }).where(eq(seats.id, seatId));
}

export async function getAvailableSeatsCount(flightId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(seats)
    .where(and(eq(seats.flightId, flightId), eq(seats.status, "available")));

  return result.length;
}

// ============================================================================
// BOOKINGS QUERIES
// ============================================================================

export async function createBooking(data: {
  bookingCode: string;
  userId: number;
  flightId: number;
  seatId: number;
  passengerName: string;
  passengerEmail: string;
  totalPrice: number;
  status?: "confirmed" | "cancelled" | "completed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bookings).values(data);
  return result;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByCode(bookingCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.bookingCode, bookingCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.bookingDate));
}

export async function cancelBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(bookings)
    .set({ status: "cancelled", cancellationDate: new Date() })
    .where(eq(bookings.id, bookingId));
}

export async function getFlightBookings(flightId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.flightId, flightId), eq(bookings.status, "confirmed")));
}

export async function getBookingStats(flightId: number) {
  const db = await getDb();
  if (!db) return { total: 0, confirmed: 0, cancelled: 0 };

  const result = await db.select().from(bookings).where(eq(bookings.flightId, flightId));

  return {
    total: result.length,
    confirmed: result.filter(b => b.status === "confirmed").length,
    cancelled: result.filter(b => b.status === "cancelled").length,
  };
}
