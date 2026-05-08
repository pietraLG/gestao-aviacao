import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, flights, bookings, Flight, Booking } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// Flight queries
export async function createFlight(data: {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  aircraftType: string;
  totalSeats: number;
  price: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(flights).values({
    ...data,
    availableSeats: data.totalSeats,
    status: "scheduled",
  });

  return result;
}

export async function getFlights(filters?: {
  origin?: string;
  destination?: string;
  departureDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  if (filters?.origin) {
    conditions.push(eq(flights.origin, filters.origin));
  }
  if (filters?.destination) {
    conditions.push(eq(flights.destination, filters.destination));
  }

  const result = conditions.length > 0
    ? await db.select().from(flights).where(and(...conditions))
    : await db.select().from(flights);
  return result;
}

export async function getFlightById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(flights).where(eq(flights.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateFlight(id: number, data: Partial<Flight>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(flights).set(data).where(eq(flights.id, id));
}

// Booking queries
export async function createBooking(data: {
  userId: number;
  flightId: number;
  seatNumber: string;
  bookingCode: string;
  totalPrice: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bookings).values({
    ...data,
    status: "confirmed",
  });

  return result;
}

export async function getBookingsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(bookings).where(eq(bookings.userId, userId));
  return result;
}

export async function getBookingByCode(bookingCode: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(bookings).where(eq(bookings.bookingCode, bookingCode)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function cancelBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId));
}

export async function getBookedSeats(flightId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ seatNumber: bookings.seatNumber })
    .from(bookings)
    .where(and(eq(bookings.flightId, flightId), eq(bookings.status, "confirmed")));

  return result.map(r => r.seatNumber);
}
