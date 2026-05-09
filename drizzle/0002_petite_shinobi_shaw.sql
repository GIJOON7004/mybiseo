ALTER TABLE `seo_leads` ADD `hospital_name` varchar(200);--> statement-breakpoint
ALTER TABLE `seo_leads` ADD `specialty` varchar(100);--> statement-breakpoint
ALTER TABLE `seo_leads` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `seo_leads` ADD `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `seo_leads` ADD `privacy_consent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `seo_leads` ADD `marketing_consent` boolean DEFAULT false NOT NULL;