import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createFlight,
  getFlightById,
  searchFlights,
  getAllFlights,
  updateFlightStatus,
  getFlightSeats,
  createSeats,
  updateSeatStatus,
  getAvailableSeatsCount,
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingByCode,
  getBookingById,
  getFlightBookings,
  getBookingStats,
  createAircraft,
  getAllAircraft,
  getAircraftById,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // FLIGHTS PROCEDURES
  // ============================================================================
  flights: router({
    // Buscar voos (público)
    search: publicProcedure
      .input(
        z.object({
          origin: z.string().min(2).max(10),
          destination: z.string().min(2).max(10),
          departureDate: z.string().datetime(),
        })
      )
      .query(async ({ input }) => {
        const date = new Date(input.departureDate);
        const results = await searchFlights(input.origin, input.destination, date);
        
        // Enriquecer com informações de disponibilidade
        const enriched = await Promise.all(
          results.map(async (flight) => {
            const availableSeats = await getAvailableSeatsCount(flight.id);
            return {
              ...flight,
              availableSeats,
            };
          })
        );

        return enriched;
      }),

    // Obter detalhes de um voo (público)
    getById: publicProcedure
      .input(z.object({ flightId: z.number() }))
      .query(async ({ input }) => {
        const flight = await getFlightById(input.flightId);
        if (!flight) return null;

        const availableSeats = await getAvailableSeatsCount(input.flightId);
        const seats = await getFlightSeats(input.flightId);

        return {
          ...flight,
          availableSeats,
          totalSeats: seats.length,
        };
      }),

    // Listar todos os voos (admin)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await getAllFlights();
    }),

    // Criar novo voo (admin)
    create: protectedProcedure
      .input(
        z.object({
          flightNumber: z.string().min(3).max(20),
          aircraftId: z.number(),
          origin: z.string().min(2).max(10),
          destination: z.string().min(2).max(10),
          departureTime: z.string().datetime(),
          arrivalTime: z.string().datetime(),
          pricePerSeat: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const aircraft_data = await getAircraftById(input.aircraftId);
        if (!aircraft_data) {
          throw new Error("Aircraft not found");
        }

        const result = await createFlight({
          flightNumber: input.flightNumber,
          aircraftId: input.aircraftId,
          origin: input.origin,
          destination: input.destination,
          departureTime: new Date(input.departureTime),
          arrivalTime: new Date(input.arrivalTime),
          pricePerSeat: input.pricePerSeat,
          status: "scheduled",
        });

        // Extrair ID do voo criado
        const flightId = (result as any).insertId;

        // Criar assentos para o voo
        const config = JSON.parse(aircraft_data.seatConfiguration);
        const seatData = [];

        for (let row = 1; row <= config.rows; row++) {
          for (let i = 0; i < config.seatsPerRow; i++) {
            const column = config.layout[i];
            const seatNumber = `${row}${column}`;

            // Determinar classe do assento
            let seatClass = "economy";
            if (row <= 3) {
              seatClass = i < 2 ? "first" : "business";
            } else if (row <= 8) {
              seatClass = "business";
            }

            seatData.push({
              flightId,
              seatNumber,
              row,
              column,
              status: "available" as const,
              seatClass: seatClass as "economy" | "business" | "first",
            });
          }
        }

        await createSeats(seatData);

        return { flightId, message: "Flight created successfully" };
      }),

    // Atualizar status de voo (admin)
    updateStatus: protectedProcedure
      .input(
        z.object({
          flightId: z.number(),
          status: z.enum(["scheduled", "boarding", "departed", "cancelled"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }

        await updateFlightStatus(input.flightId, input.status);
        return { success: true };
      }),
  }),

  // ============================================================================
  // SEATS PROCEDURES
  // ============================================================================
  seats: router({
    // Obter mapa de assentos de um voo (público)
    getFlightSeats: publicProcedure
      .input(z.object({ flightId: z.number() }))
      .query(async ({ input }) => {
        const seats = await getFlightSeats(input.flightId);
        return seats.map(seat => ({
          id: seat.id,
          row: seat.row,
          column: seat.column,
          seatNumber: seat.seatNumber,
          status: seat.status,
          seatClass: seat.seatClass,
        }));
      }),

    // Obter disponibilidade de assentos (público)
    getAvailability: publicProcedure
      .input(z.object({ flightId: z.number() }))
      .query(async ({ input }) => {
        const seats = await getFlightSeats(input.flightId);
        const available = seats.filter(s => s.status === "available").length;
        const occupied = seats.filter(s => s.status === "occupied").length;
        const reserved = seats.filter(s => s.status === "reserved").length;

        return {
          available,
          occupied,
          reserved,
          total: seats.length,
          occupancyRate: ((occupied + reserved) / seats.length) * 100,
        };
      }),
  }),

  // ============================================================================
  // BOOKINGS PROCEDURES
  // ============================================================================
  bookings: router({
    // Criar reserva (protegido)
    create: protectedProcedure
      .input(
        z.object({
          flightId: z.number(),
          seatId: z.number(),
          passengerName: z.string().min(2),
          passengerEmail: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");

        const flight = await getFlightById(input.flightId);
        if (!flight) throw new Error("Flight not found");

        // Verificar disponibilidade do assento
        const seats = await getFlightSeats(input.flightId);
        const seat = seats.find(s => s.id === input.seatId);
        if (!seat || seat.status !== "available") {
          throw new Error("Seat not available");
        }

        // Gerar código de reserva
        const bookingCode = `BK${Date.now().toString().slice(-6)}`;

        // Criar reserva
        const result = await createBooking({
          bookingCode,
          userId: ctx.user.id,
          flightId: input.flightId,
          seatId: input.seatId,
          passengerName: input.passengerName,
          passengerEmail: input.passengerEmail,
          totalPrice: flight.pricePerSeat,
          status: "confirmed",
        });

        // Atualizar status do assento
        await updateSeatStatus(input.seatId, "reserved");

        return {
          bookingCode,
          message: "Booking created successfully",
        };
      }),

    // Listar reservas do usuário (protegido)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const bookings = await getUserBookings(ctx.user.id);
      
      // Enriquecer com informações de voo e assento
      const enriched = await Promise.all(
        bookings.map(async (booking) => {
          const flight = await getFlightById(booking.flightId);
          return {
            ...booking,
            flight: {
              flightNumber: flight?.flightNumber,
              origin: flight?.origin,
              destination: flight?.destination,
              departureTime: flight?.departureTime,
            },
          };
        })
      );

      return enriched;
    }),

    // Obter detalhes de uma reserva (protegido)
    getByCode: protectedProcedure
      .input(z.object({ bookingCode: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");

        const booking = await getBookingByCode(input.bookingCode);
        if (!booking || booking.userId !== ctx.user.id) {
          throw new Error("Booking not found");
        }

        const flight = await getFlightById(booking.flightId);
        return {
          ...booking,
          flight,
        };
      }),

    // Cancelar reserva (protegido)
    cancel: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");

        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.userId !== ctx.user.id) {
          throw new Error("Booking not found or unauthorized");
        }

        // Liberar assento
        await updateSeatStatus(booking.seatId, "available");

        // Cancelar reserva
        await cancelBooking(input.bookingId);

        return { success: true, message: "Booking cancelled successfully" };
      }),
  }),

  // ============================================================================
  // AIRCRAFT PROCEDURES
  // ============================================================================
  aircraft: router({
    // Listar todas as aeronaves (admin)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await getAllAircraft();
    }),

    // Criar nova aeronave (admin)
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          manufacturer: z.string().min(2),
          totalSeats: z.number().positive(),
          rows: z.number().positive(),
          seatsPerRow: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const config = {
          rows: input.rows,
          seatsPerRow: input.seatsPerRow,
          layout: "ABCDEF".slice(0, input.seatsPerRow),
        };

        const result = await createAircraft({
          name: input.name,
          manufacturer: input.manufacturer,
          totalSeats: input.totalSeats,
          seatConfiguration: JSON.stringify(config),
        });

        return { success: true, message: "Aircraft created successfully" };
      }),
  }),

  // ============================================================================
  // ADMIN DASHBOARD PROCEDURES
  // ============================================================================
  admin: router({
    // Obter estatísticas de um voo (admin)
    getFlightStats: protectedProcedure
      .input(z.object({ flightId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const flight = await getFlightById(input.flightId);
        if (!flight) throw new Error("Flight not found");

        const seats = await getFlightSeats(input.flightId);
        const bookings = await getFlightBookings(input.flightId);
        const stats = await getBookingStats(input.flightId);

        const available = seats.filter(s => s.status === "available").length;
        const occupied = seats.filter(s => s.status === "occupied").length;
        const reserved = seats.filter(s => s.status === "reserved").length;

        return {
          flight,
          seats: {
            total: seats.length,
            available,
            occupied,
            reserved,
            occupancyRate: ((occupied + reserved) / seats.length) * 100,
          },
          bookings: stats,
          revenue: stats.confirmed * flight.pricePerSeat,
        };
      }),

    // Obter estatísticas globais (admin)
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const flights = await getAllFlights();
      const flightStats = await Promise.all(
        flights.map(async (flight) => {
          const bookings = await getFlightBookings(flight.id);
          return {
            flightId: flight.id,
            flightNumber: flight.flightNumber,
            bookingCount: bookings.length,
            revenue: bookings.length * flight.pricePerSeat,
          };
        })
      );

      const totalRevenue = flightStats.reduce((sum, f) => sum + f.revenue, 0);
      const totalBookings = flightStats.reduce((sum, f) => sum + f.bookingCount, 0);

      return {
        totalFlights: flights.length,
        totalBookings,
        totalRevenue,
        flightStats,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
