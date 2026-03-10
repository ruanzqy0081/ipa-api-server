CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`udid` varchar(255) NOT NULL,
	`userId` int,
	`packageId` int,
	`deviceName` varchar(255),
	`status` enum('online','offline') NOT NULL DEFAULT 'offline',
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_udid_unique` UNIQUE(`udid`)
);
--> statement-breakpoint
CREATE TABLE `dylibVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`version` varchar(64) NOT NULL,
	`s3Key` varchar(255) NOT NULL,
	`s3Url` text NOT NULL,
	`fileSize` int,
	`checksum` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dylibVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`userId` int NOT NULL,
	`keyCode` varchar(255) NOT NULL,
	`alias` varchar(64),
	`duration` enum('1day','1week','1month','1year') NOT NULL,
	`status` enum('active','paused','banned','expired') NOT NULL DEFAULT 'active',
	`activatedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `keys_keyCode_unique` UNIQUE(`keyCode`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`status` enum('active','paused','maintenance','locked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` int,
	`sessionToken` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `vipLevel` enum('free','vip1','vip2','vip3','vip4') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `language` enum('pt-BR','en') DEFAULT 'pt-BR' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `devices_udid_idx` ON `devices` (`udid`);--> statement-breakpoint
CREATE INDEX `devices_userId_idx` ON `devices` (`userId`);--> statement-breakpoint
CREATE INDEX `devices_packageId_idx` ON `devices` (`packageId`);--> statement-breakpoint
CREATE INDEX `dylibVersions_packageId_idx` ON `dylibVersions` (`packageId`);--> statement-breakpoint
CREATE INDEX `keys_packageId_idx` ON `keys` (`packageId`);--> statement-breakpoint
CREATE INDEX `keys_userId_idx` ON `keys` (`userId`);--> statement-breakpoint
CREATE INDEX `packages_userId_idx` ON `packages` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_sessionToken_idx` ON `sessions` (`sessionToken`);