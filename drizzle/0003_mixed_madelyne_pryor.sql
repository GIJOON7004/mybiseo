CREATE TABLE `ab_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`event_type` enum('impression','click','conversion') NOT NULL,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`target_element` varchar(100) NOT NULL,
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`started_at` timestamp,
	`ended_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`weight` int NOT NULL DEFAULT 50,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosis_automation_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`daily_threshold` int NOT NULL DEFAULT 10,
	`auto_send_enabled` boolean NOT NULL DEFAULT false,
	`quality_min_score` int NOT NULL DEFAULT 20,
	`quality_required_sections` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnosis_automation_config_id` PRIMARY KEY(`id`)
);
