import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

function generateBookingCode(): string {
  return "BK" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSeats(rows: number = 10, cols: number = 6): string[] {
  const seats: string[] = [];
  for (let i = 1; i <= rows; i++) {
    for (let j = 0; j < cols; j++) {
      seats.push(`${i}${String.fromCharCode(65 + j)}`);
    }
  }
  return seats;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Flights
  flights: router({
    search: publicProcedure
      .input(z.object({
        origin: z.string().optional(),
        destination: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const results = await db.getFlights({
          origin: input.origin,
          destination: input.destination,
        });
        return results.map(f => ({
          id: f.id,
          flightNumber: f.flightNumber,
          origin: f.origin,
          destination: f.destination,
          departureTime: f.departureTime,
          arrivalTime: f.arrivalTime,
          aircraftType: f.aircraftType,
          totalSeats: f.totalSeats,
          availableSeats: f.availableSeats,
          price: parseFloat(f.price as any),
          status: f.status,
        }));
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const flight = await db.getFlightById(input);
        if (!flight) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          id: flight.id,
          flightNumber: flight.flightNumber,
          origin: flight.origin,
          destination: flight.destination,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          aircraftType: flight.aircraftType,
          totalSeats: flight.totalSeats,
          availableSeats: flight.availableSeats,
          price: parseFloat(flight.price as any),
          status: flight.status,
        };
      }),

    list: publicProcedure.query(async () => {
      const results = await db.getFlights();
      return results.map(f => ({
        id: f.id,
        flightNumber: f.flightNumber,
        origin: f.origin,
        destination: f.destination,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        aircraftType: f.aircraftType,
        totalSeats: f.totalSeats,
        availableSeats: f.availableSeats,
        price: parseFloat(f.price as any),
        status: f.status,
      }));
    }),

    create: protectedProcedure
      .input(z.object({
        flightNumber: z.string(),
        origin: z.string(),
        destination: z.string(),
        departureTime: z.date(),
        arrivalTime: z.date(),
        aircraftType: z.string(),
        totalSeats: z.number().default(180),
        price: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.createFlight({
          flightNumber: input.flightNumber,
          origin: input.origin,
          destination: input.destination,
          departureTime: input.departureTime,
          arrivalTime: input.arrivalTime,
          aircraftType: input.aircraftType,
          totalSeats: input.totalSeats,
          price: input.price.toString(),
        });

        return { success: true };
      }),
  }),

  // Seats
  seats: router({
    getAvailable: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const booked = await db.getBookedSeats(input);
        const allSeats = generateSeats(10, 6);
        const available = allSeats.filter(s => !booked.includes(s));
        return {
          available,
          booked,
          total: allSeats.length,
        };
      }),
  }),

  // Bookings
  bookings: router({
    create: protectedProcedure
      .input(z.object({
        flightId: z.number(),
        seatNumber: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const flight = await db.getFlightById(input.flightId);
        if (!flight) throw new TRPCError({ code: "NOT_FOUND" });

        const booked = await db.getBookedSeats(input.flightId);
        if (booked.includes(input.seatNumber)) {
          throw new TRPCError({ code: "CONFLICT", message: "Seat already booked" });
        }

        const bookingCode = generateBookingCode();
        const price = parseFloat(flight.price as any);

        await db.createBooking({
          userId: ctx.user.id,
          flightId: input.flightId,
          seatNumber: input.seatNumber,
          bookingCode,
          totalPrice: price.toString(),
        });

        return {
          bookingCode,
          seatNumber: input.seatNumber,
          price,
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bookings = await db.getBookingsByUser(ctx.user.id);
      
      const enriched = await Promise.all(
        bookings.map(async (b) => {
          const flight = await db.getFlightById(b.flightId);
          return {
            id: b.id,
            bookingCode: b.bookingCode,
            seatNumber: b.seatNumber,
            status: b.status,
            price: parseFloat(b.totalPrice as any),
            flight: flight ? {
              flightNumber: flight.flightNumber,
              origin: flight.origin,
              destination: flight.destination,
              departureTime: flight.departureTime,
            } : null,
          };
        })
      );

      return enriched;
    }),

    cancel: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.cancelBooking(input);
        return { success: true };
      }),
  }),

  // Admin
  admin: router({
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const allFlights = await db.getFlights();
      const totalFlights = allFlights.length;
      const totalBookings = allFlights.reduce((sum, f) => sum + (f.totalSeats - f.availableSeats), 0);
      const totalRevenue = allFlights.reduce((sum, f) => sum + ((f.totalSeats - f.availableSeats) * parseFloat(f.price as any)), 0);

      return {
        totalFlights,
        totalBookings,
        totalRevenue,
        occupancyRate: totalFlights > 0 ? ((totalBookings / (totalFlights * 180)) * 100).toFixed(1) : "0",
      };
    }),

    getFlights: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const flights = await db.getFlights();
      return flights.map(f => ({
        id: f.id,
        flightNumber: f.flightNumber,
        origin: f.origin,
        destination: f.destination,
        departureTime: f.departureTime,
        totalSeats: f.totalSeats,
        availableSeats: f.availableSeats,
        price: parseFloat(f.price as any),
        status: f.status,
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
