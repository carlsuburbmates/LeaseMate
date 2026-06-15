CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`actorType` enum('customer','provider','operator','system') NOT NULL,
	`actorId` int,
	`description` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(100) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`status` enum('scheduled','running','completed','failed','retrying') NOT NULL DEFAULT 'scheduled',
	`payload` json,
	`result` json,
	`errorMessage` text,
	`attemptCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`introductionFeeId` int NOT NULL,
	`moveRequestItemId` int NOT NULL,
	`providerId` int NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('pending','released','failed') NOT NULL DEFAULT 'pending',
	`releasedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_releases_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_releases_introductionFeeId_unique` UNIQUE(`introductionFeeId`)
);
--> statement-breakpoint
CREATE TABLE `exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('EX-01','EX-02','EX-03','EX-04','EX-05','EX-06','EX-07','EX-08','EX-09','EX-10','EX-11','EX-12','EX-13') NOT NULL,
	`severity` enum('critical','warning','informational') NOT NULL,
	`affectedParty` varchar(100) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`moveRequestId` int,
	`providerId` int,
	`customerId` int,
	`description` text NOT NULL,
	`status` enum('open','in_review','resolved','dismissed') NOT NULL DEFAULT 'open',
	`operatorNotes` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `introduction_fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`providerId` int NOT NULL,
	`moveRequestItemId` int NOT NULL,
	`amount` decimal(8,2) NOT NULL,
	`status` enum('pending','paid','overdue','refunded','expired','waived') NOT NULL DEFAULT 'pending',
	`stripeCheckoutSessionId` varchar(200),
	`stripePaymentIntentId` varchar(200),
	`stripeChargeId` varchar(200),
	`paidAt` timestamp,
	`overdueAt` timestamp,
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `introduction_fees_id` PRIMARY KEY(`id`),
	CONSTRAINT `introduction_fees_invitationId_unique` UNIQUE(`invitationId`)
);
--> statement-breakpoint
CREATE TABLE `move_request_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moveRequestId` int NOT NULL,
	`categoryId` int NOT NULL,
	`productId` int NOT NULL,
	`position` enum('preferred','backup') NOT NULL,
	`status` enum('pending_match','invitation_sent','provider_accepted','details_released','all_declined','exception','cancelled') NOT NULL DEFAULT 'pending_match',
	`customerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `move_request_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `move_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('draft','submitted','in_progress','partially_fulfilled','fulfilled','cancelled') NOT NULL DEFAULT 'draft',
	`moveOutDate` timestamp,
	`propertyAddress` text NOT NULL,
	`propertySuburb` varchar(100) NOT NULL,
	`propertyPostcode` varchar(10),
	`propertyType` enum('apartment','house','townhouse','studio','other') NOT NULL,
	`bedrooms` int NOT NULL,
	`bathrooms` int NOT NULL,
	`accessNotes` text,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `move_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moveRequestItemId` int NOT NULL,
	`providerId` int NOT NULL,
	`status` enum('pending','accepted','declined','expired','cancelled') NOT NULL DEFAULT 'pending',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`respondedAt` timestamp,
	`declineReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(200) NOT NULL,
	`abn` varchar(20),
	`phone` varchar(20),
	`contactEmail` varchar(320),
	`suburb` varchar(100),
	`status` enum('active','paused','suspended','pending') NOT NULL DEFAULT 'pending',
	`pauseReason` text,
	`maxJobsPerWeek` int NOT NULL DEFAULT 10,
	`stripeCustomerId` varchar(100),
	`stripePaymentMethodId` varchar(100),
	`timeoutCount30Days` int NOT NULL DEFAULT 0,
	`lastTimeoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `provider_timeout_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` int NOT NULL,
	`invitationId` int NOT NULL,
	`timedOutAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_timeout_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconName` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `service_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `service_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` int NOT NULL,
	`categoryId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`priceType` enum('fixed','hourly','quote') NOT NULL,
	`priceAmount` decimal(10,2),
	`priceLabel` varchar(100),
	`coverageZones` json,
	`propertyTypes` json,
	`maxBedrooms` int,
	`introductionFee` decimal(8,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suburbs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`postcode` varchar(10) NOT NULL,
	`lga` varchar(100),
	`zone` enum('inner','middle','outer') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `suburbs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','customer','provider','operator') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` ADD `isFlagged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `flagReason` text;
