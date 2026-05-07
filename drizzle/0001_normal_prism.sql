CREATE TABLE `aircraft` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`manufacturer` varchar(100) NOT NULL,
	`totalSeats` int NOT NULL,
	`seatConfiguration` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aircraft_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingCode` varchar(10) NOT NULL,
	`userId` int NOT NULL,
	`flightId` int NOT NULL,
	`seatId` int NOT NULL,
	`passengerName` varchar(255) NOT NULL,
	`passengerEmail` varchar(320) NOT NULL,
	`totalPrice` int NOT NULL,
	`status` enum('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
	`bookingDate` timestamp NOT NULL DEFAULT (now()),
	`cancellationDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingCode_unique` UNIQUE(`bookingCode`)
);
--> statement-breakpoint
CREATE TABLE `flights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flightNumber` varchar(20) NOT NULL,
	`aircraftId` int NOT NULL,
	`origin` varchar(50) NOT NULL,
	`destination` varchar(50) NOT NULL,
	`departureTime` timestamp NOT NULL,
	`arrivalTime` timestamp NOT NULL,
	`pricePerSeat` int NOT NULL,
	`status` enum('scheduled','boarding','departed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flights_id` PRIMARY KEY(`id`),
	CONSTRAINT `flights_flightNumber_unique` UNIQUE(`flightNumber`)
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flightId` int NOT NULL,
	`seatNumber` varchar(10) NOT NULL,
	`row` int NOT NULL,
	`column` varchar(1) NOT NULL,
	`status` enum('available','occupied','reserved') NOT NULL DEFAULT 'available',
	`seatClass` enum('economy','business','first') NOT NULL DEFAULT 'economy',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seats_id` PRIMARY KEY(`id`)
);
