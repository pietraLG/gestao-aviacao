import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createFlight: vi.fn(async () => ({ insertId: 1 })),
  getFlightById: vi.fn(async (id: number) => ({
    id,
    flightNumber: "TP123",
    aircraftId: 1,
    origin: "LIS",
    destination: "NYC",
    departureTime: new Date("2026-06-01T10:00:00"),
    arrivalTime: new Date("2026-06-01T18:00:00"),
    pricePerSeat: 50000, // €500
    status: "scheduled",
  })),
  searchFlights: vi.fn(async () => [
    {
      id: 1,
      flightNumber: "TP123",
      origin: "LIS",
      destination: "NYC",
      departureTime: new Date("2026-06-01T10:00:00"),
      arrivalTime: new Date("2026-06-01T18:00:00"),
      pricePerSeat: 50000,
      status: "scheduled",
      aircraftId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAllFlights: vi.fn(async () => []),
  updateFlightStatus: vi.fn(async () => ({})),
  getFlightSeats: vi.fn(async () => [
    { id: 1, flightId: 1, seatNumber: "1A", row: 1, column: "A", status: "available", seatClass: "business" },
    { id: 2, flightId: 1, seatNumber: "1B", row: 1, column: "B", status: "available", seatClass: "business" },
  ]),
  createSeats: vi.fn(async () => ({})),
  updateSeatStatus: vi.fn(async () => ({})),
  getAvailableSeatsCount: vi.fn(async () => 180),
  createBooking: vi.fn(async () => ({ insertId: 1 })),
  getUserBookings: vi.fn(async () => []),
  cancelBooking: vi.fn(async () => ({})),
  getBookingByCode: vi.fn(async () => null),
  getBookingById: vi.fn(async () => null),
  getFlightBookings: vi.fn(async () => []),
  getBookingStats: vi.fn(async () => ({ total: 0, confirmed: 0, cancelled: 0 })),
  createAircraft: vi.fn(async () => ({ insertId: 1 })),
  getAllAircraft: vi.fn(async () => [
    {
      id: 1,
      name: "Boeing 737",
      manufacturer: "Boeing",
      totalSeats: 180,
      seatConfiguration: JSON.stringify({ rows: 30, seatsPerRow: 6, layout: "ABCDEF" }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAircraftById: vi.fn(async (id: number) => ({
    id,
    name: "Boeing 737",
    manufacturer: "Boeing",
    totalSeats: 180,
    seatConfiguration: JSON.stringify({ rows: 30, seatsPerRow: 6, layout: "ABCDEF" }),
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Flights Router", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    adminCaller = appRouter.createCaller(createAdminContext());
    userCaller = appRouter.createCaller(createUserContext());
  });

  describe("flights.search", () => {
    it("should search flights for public users", async () => {
      const result = await userCaller.flights.search({
        origin: "LIS",
        destination: "NYC",
        departureDate: new Date("2026-06-01").toISOString(),
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("flights.getById", () => {
    it("should get flight details", async () => {
      const result = await userCaller.flights.getById({ flightId: 1 });

      expect(result).toBeDefined();
      expect(result?.flightNumber).toBe("TP123");
      expect(result?.origin).toBe("LIS");
      expect(result?.destination).toBe("NYC");
    });
  });

  describe("flights.list", () => {
    it("should deny access to non-admin users", async () => {
      try {
        await userCaller.flights.list();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Unauthorized");
      }
    });

    it("should allow admin users to list flights", async () => {
      const result = await adminCaller.flights.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("flights.create", () => {
    it("should deny access to non-admin users", async () => {
      try {
        await userCaller.flights.create({
          flightNumber: "TP999",
          aircraftId: 1,
          origin: "LIS",
          destination: "NYC",
          departureTime: new Date("2026-06-01T10:00:00").toISOString(),
          arrivalTime: new Date("2026-06-01T18:00:00").toISOString(),
          pricePerSeat: 50000,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).message).toContain("Unauthorized");
      }
    });

    it("should allow admin users to create flights", async () => {
      const result = await adminCaller.flights.create({
        flightNumber: "TP999",
        aircraftId: 1,
        origin: "LIS",
        destination: "NYC",
        departureTime: new Date("2026-06-01T10:00:00").toISOString(),
        arrivalTime: new Date("2026-06-01T18:00:00").toISOString(),
        pricePerSeat: 50000,
      });

      expect(result).toBeDefined();
      expect(result.flightId).toBeDefined();
    });
  });
});

describe("Seats Router", () => {
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    userCaller = appRouter.createCaller(createUserContext());
  });

  describe("seats.getFlightSeats", () => {
    it("should get seats for a flight", async () => {
      const result = await userCaller.seats.getFlightSeats({ flightId: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("seatNumber");
      expect(result[0]).toHaveProperty("status");
    });
  });

  describe("seats.getAvailability", () => {
    it("should get seat availability for a flight", async () => {
      const result = await userCaller.seats.getAvailability({ flightId: 1 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("available");
      expect(result).toHaveProperty("occupied");
      expect(result).toHaveProperty("reserved");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("occupancyRate");
    });
  });
});

describe("Bookings Router", () => {
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    userCaller = appRouter.createCaller(createUserContext());
  });

  describe("bookings.list", () => {
    it("should get user bookings", async () => {
      const result = await userCaller.bookings.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
