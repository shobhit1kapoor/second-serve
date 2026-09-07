CREATE TABLE `commands` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`handled` integer DEFAULT 0 NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `commands_run_pending` ON `commands` (`run_id`,`handled`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`status` text NOT NULL,
	`mode` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runs_owner_started` ON `runs` (`owner`,`started_at`);--> statement-breakpoint
CREATE INDEX `runs_started` ON `runs` (`started_at`);