CREATE TABLE `ai_crawler_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crawler_name` varchar(100) NOT NULL,
	`path` varchar(500) NOT NULL,
	`user_agent` text,
	`ip` varchar(45),
	`visited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_crawler_visits_id` PRIMARY KEY(`id`)
);
