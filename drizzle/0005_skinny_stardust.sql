CREATE TABLE `llm_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caller` varchar(100) NOT NULL,
	`prompt_tokens` int NOT NULL DEFAULT 0,
	`completion_tokens` int NOT NULL DEFAULT 0,
	`total_tokens` int NOT NULL DEFAULT 0,
	`cached` boolean NOT NULL DEFAULT false,
	`duration_ms` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_usage_logs_id` PRIMARY KEY(`id`)
);
