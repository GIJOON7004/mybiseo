CREATE TABLE `ad_brand_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_url` varchar(500) NOT NULL,
	`hospital_name` varchar(200),
	`logo_url` text,
	`primary_color` varchar(20),
	`secondary_color` varchar(20),
	`accent_color` varchar(20),
	`font_style` varchar(100),
	`tone_of_voice` varchar(100),
	`target_audience` text,
	`brand_keywords` text,
	`specialties` text,
	`brand_summary` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_brand_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`brand_profile_id` int,
	`platform` varchar(50) NOT NULL,
	`ad_type` varchar(50) NOT NULL,
	`treatment_name` varchar(200),
	`headline` varchar(300),
	`body_text` text,
	`cta_text` varchar(100),
	`image_url` text,
	`image_prompt` text,
	`dimensions` varchar(30),
	`hashtags` text,
	`compliance_status` varchar(30) DEFAULT 'unchecked',
	`compliance_notes` text,
	`is_favorite` int DEFAULT 0,
	`status` varchar(30) NOT NULL DEFAULT 'generated',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text,
	`metadata` json,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_blog_trials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_name` varchar(200) NOT NULL,
	`specialty` varchar(100) NOT NULL,
	`topic` varchar(300),
	`generated_title` varchar(500),
	`generated_content` text,
	`ip_address` varchar(45),
	`user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_blog_trials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_content_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_type` enum('blog','cardnews','video_script','poster') NOT NULL,
	`hospital_name` varchar(200),
	`specialty` varchar(100),
	`prompt` text,
	`generated_title` varchar(500),
	`generated_content` text,
	`generated_image_url` text,
	`preset_id` varchar(100),
	`review_verdict` enum('pass','warning','fail'),
	`review_score` int,
	`review_issues` text,
	`review_summary` text,
	`revised_content` text,
	`naver_published` int DEFAULT 0,
	`naver_post_url` text,
	`naver_published_at` timestamp,
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_content_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_exposure_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword_id` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`mention_score` int NOT NULL DEFAULT 0,
	`rank_score` int NOT NULL DEFAULT 0,
	`sentiment_score` int NOT NULL DEFAULT 0,
	`competitor_score` int NOT NULL DEFAULT 0,
	`platform_scores` json,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_exposure_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_improvement_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword_id` int,
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`overall_score` int NOT NULL DEFAULT 0,
	`recommendations` text,
	`platform_analysis` text,
	`competitor_insights` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_improvement_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_monitor_competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword_id` int NOT NULL,
	`competitor_name` varchar(200) NOT NULL,
	`competitor_url` varchar(2048),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_monitor_competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_monitor_keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(200) NOT NULL,
	`hospital_name` varchar(200) NOT NULL,
	`specialty` varchar(100),
	`is_active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_monitor_keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_monitor_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword_id` int NOT NULL,
	`platform` enum('chatgpt','gemini','claude','perplexity','grok') NOT NULL,
	`query` varchar(500) NOT NULL,
	`response` text NOT NULL,
	`mentioned` int NOT NULL DEFAULT 0,
	`mention_context` text,
	`sentiment` enum('positive','neutral','negative'),
	`rank` int,
	`competitors_mentioned` text,
	`mention_position` varchar(20),
	`recommendation_type` varchar(50),
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_monitor_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rule_id` int NOT NULL,
	`user_id` int NOT NULL,
	`recipient_email` varchar(300),
	`recipient_phone` varchar(30),
	`channel` varchar(30) NOT NULL,
	`status` varchar(20) NOT NULL,
	`error_message` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`hospital_id` int,
	`rule_type` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`channel` varchar(30) NOT NULL DEFAULT 'email',
	`template_content` text,
	`trigger_config` json,
	`last_triggered_at` timestamp,
	`trigger_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `benchmark_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(20) NOT NULL,
	`specialty` varchar(100),
	`region` varchar(100),
	`avg_total_score` int NOT NULL DEFAULT 0,
	`avg_ai_score` int NOT NULL DEFAULT 0,
	`sample_count` int NOT NULL DEFAULT 0,
	`top_percentile` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `benchmark_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `benchmarking_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`hospital_name` varchar(200) NOT NULL,
	`hospital_url` varchar(2048) NOT NULL,
	`specialty` varchar(100),
	`competitors` text NOT NULL,
	`my_score` int NOT NULL,
	`my_grade` varchar(10) NOT NULL,
	`report_title` varchar(500) NOT NULL,
	`executive_summary` text NOT NULL,
	`category_comparison` text NOT NULL,
	`actionable_insights` text NOT NULL,
	`sns_marketing_tips` text,
	`weekly_plan` text,
	`report_status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`pdf_url` text,
	`share_token` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `benchmarking_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`meta_title` varchar(200),
	`meta_description` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`excerpt` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`meta_title` varchar(200),
	`meta_description` varchar(500),
	`tags` text,
	`reading_time` int NOT NULL DEFAULT 5,
	`view_count` int NOT NULL DEFAULT 0,
	`published` enum('draft','published','scheduled') NOT NULL DEFAULT 'published',
	`scheduled_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `booking_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`setting_id` int NOT NULL,
	`treatment_name` varchar(200) NOT NULL,
	`treatment_category` varchar(100),
	`duration` int NOT NULL,
	`price` int,
	`price_note` varchar(200),
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cardnews_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`specialty` varchar(100) NOT NULL,
	`category` enum('event','info','seasonal','review','before_after') NOT NULL,
	`description` text,
	`prompt_template` text NOT NULL,
	`sample_image_url` text,
	`is_active` int NOT NULL DEFAULT 1,
	`usage_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cardnews_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_key` varchar(64) NOT NULL,
	`visitor_name` varchar(100),
	`visitor_phone` varchar(30),
	`visitor_email` varchar(320),
	`message_count` int NOT NULL DEFAULT 0,
	`has_inquiry` int NOT NULL DEFAULT 0,
	`insight_specialty` varchar(100),
	`insight_intent_type` varchar(50),
	`insight_conversion_likelihood` varchar(20),
	`insight_summary` text,
	`insight_extracted_at` timestamp,
	`last_message_at` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_sessions_session_key_unique` UNIQUE(`session_key`)
);
--> statement-breakpoint
CREATE TABLE `consultation_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_id` int NOT NULL,
	`patient_name` varchar(100),
	`patient_phone` varchar(30),
	`patient_email` varchar(320),
	`treatment_type` varchar(200),
	`message` text,
	`channel` varchar(50),
	`status` enum('pending','contacted','completed','cancelled') NOT NULL DEFAULT 'pending',
	`contacted_at` timestamp,
	`note` text,
	`visitor_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultation_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`title` varchar(500) NOT NULL,
	`script_id` int,
	`platform` varchar(50) NOT NULL,
	`scheduled_date` timestamp NOT NULL,
	`scheduled_time` varchar(10),
	`status` varchar(30) NOT NULL DEFAULT 'planned',
	`published_url` text,
	`performance` text,
	`notes` text,
	`interview_video_id` int,
	`content_type` varchar(30),
	`content_index` int,
	`content_summary` text,
	`color_tag` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_calendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_hooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hook_text` text NOT NULL,
	`hook_type` varchar(50),
	`platform` varchar(50),
	`category` varchar(100),
	`source_idea_id` int,
	`effectiveness` varchar(20),
	`usage_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_hooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_ideas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`title` varchar(500) NOT NULL,
	`source_url` text,
	`source_type` varchar(50),
	`platform` varchar(50),
	`category` varchar(100),
	`why_it_works` text,
	`view_count` varchar(50),
	`thumbnail_url` text,
	`notes` text,
	`status` varchar(30) NOT NULL DEFAULT 'collected',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_ideas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`title` varchar(500) NOT NULL,
	`hook_id` int,
	`idea_id` int,
	`platform` varchar(50),
	`script_type` varchar(50),
	`duration` varchar(30),
	`hook_section` text,
	`body_section` text,
	`cta_section` text,
	`full_script` text,
	`hashtags` text,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_style_guides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`brand_color` varchar(50),
	`sub_colors` text,
	`font_style` varchar(100),
	`tone_of_voice` varchar(100),
	`target_audience` text,
	`brand_keywords` text,
	`do_list` text,
	`dont_list` text,
	`reference_urls` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_style_guides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosis_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(2048) NOT NULL,
	`total_score` int NOT NULL,
	`ai_score` int NOT NULL DEFAULT 0,
	`grade` varchar(10) NOT NULL,
	`specialty` varchar(100),
	`region` varchar(100),
	`category_scores` text,
	`diagnosed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosis_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`hospital_name` varchar(200),
	`specialty` varchar(100),
	`phone` varchar(30),
	`email_source` enum('seo_checker','seo_compare','newsletter','benchmarking_report','consultation','blog_subscribe','manual','import') NOT NULL DEFAULT 'manual',
	`tags` json,
	`marketing_consent` boolean NOT NULL DEFAULT true,
	`contact_status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`last_diagnosis_url` varchar(2048),
	`last_diagnosis_score` int,
	`last_diagnosis_grade` varchar(10),
	`total_emails_sent` int NOT NULL DEFAULT 0,
	`last_email_sent_at` timestamp,
	`total_emails_opened` int NOT NULL DEFAULT 0,
	`last_opened_at` timestamp,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_send_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact_id` int,
	`email` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`template_type` varchar(50) NOT NULL,
	`send_status` enum('sent','failed','bounced') NOT NULL DEFAULT 'sent',
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_send_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospital_info_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_id` int NOT NULL,
	`category` enum('price','hours','event','faq','notice') NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospital_info_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospital_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`hospital_name` varchar(200) NOT NULL,
	`hospital_url` varchar(2048) NOT NULL,
	`specialty` varchar(100),
	`region` varchar(100),
	`phone` varchar(30),
	`plan` enum('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
	`is_active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospital_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(320) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','contacted','completed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`video_url` text NOT NULL,
	`video_file_key` varchar(500) NOT NULL,
	`file_name` varchar(300),
	`duration_sec` int,
	`file_size_bytes` int,
	`transcript` text,
	`transcript_lang` varchar(10),
	`status` varchar(30) NOT NULL DEFAULT 'uploading',
	`error_message` text,
	`blog_contents` text,
	`cardnews_contents` text,
	`shortform_contents` text,
	`doctor_name` varchar(100),
	`hospital_name` varchar(200),
	`topic_keyword` varchar(200),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kakao_booking_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`hospital_id` int,
	`kakao_channel_id` varchar(100),
	`kakao_channel_name` varchar(200),
	`kakao_channel_url` varchar(500),
	`is_active` boolean NOT NULL DEFAULT false,
	`default_duration` int NOT NULL DEFAULT 30,
	`max_daily_slots` int NOT NULL DEFAULT 20,
	`working_hours_start` varchar(5) NOT NULL DEFAULT '09:00',
	`working_hours_end` varchar(5) NOT NULL DEFAULT '18:00',
	`lunch_start` varchar(5) DEFAULT '12:00',
	`lunch_end` varchar(5) DEFAULT '13:00',
	`closed_days` json,
	`booking_notice` text,
	`auto_confirm` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kakao_booking_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`hospital_id` int,
	`source_type` varchar(50) NOT NULL,
	`source_id` int,
	`channel` varchar(30) NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`image_urls` json,
	`hashtags` text,
	`scheduled_at` timestamp,
	`published_at` timestamp,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_awards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(20) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`hospital_name` varchar(200),
	`specialty` varchar(100),
	`total_score` int NOT NULL,
	`ai_score` int NOT NULL DEFAULT 0,
	`rank` int NOT NULL,
	`badge_type` enum('gold','silver','bronze','top10','top30') NOT NULL DEFAULT 'top30',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_awards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_id` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`seo_score` int,
	`seo_score_change` int,
	`ai_exposure_score` int,
	`ai_exposure_change` int,
	`total_visits` int DEFAULT 0,
	`ai_channel_visits` int DEFAULT 0,
	`naver_visits` int DEFAULT 0,
	`google_visits` int DEFAULT 0,
	`sns_visits` int DEFAULT 0,
	`direct_visits` int DEFAULT 0,
	`total_inquiries` int DEFAULT 0,
	`conversion_rate` varchar(10),
	`summary` text,
	`recommendations` text,
	`pdf_url` varchar(2048),
	`share_token` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`hospital_name` varchar(200),
	`specialty` varchar(100),
	`is_active` int NOT NULL DEFAULT 1,
	`source` varchar(50) NOT NULL DEFAULT 'website',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `seasonal_calendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialty` varchar(100) NOT NULL,
	`month` int NOT NULL,
	`keyword` varchar(200) NOT NULL,
	`category` enum('시술','이벤트','건강정보','프로모션') NOT NULL,
	`description` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`tips` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasonal_calendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(200) NOT NULL,
	`category_id` int NOT NULL,
	`status` enum('pending','generating','draft_ready','review_done','scheduled','published') NOT NULL DEFAULT 'pending',
	`blog_post_id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seo_keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`total_score` int,
	`grade` varchar(10),
	`ai_score` int,
	`source` enum('seo_checker','seo_compare') NOT NULL DEFAULT 'seo_checker',
	`status` enum('new','consulting','contracted','lost') NOT NULL DEFAULT 'new',
	`followup_3d_sent` int NOT NULL DEFAULT 0,
	`followup_7d_sent` int NOT NULL DEFAULT 0,
	`note` text,
	`priority` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seo_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_id` int NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`channel` enum('ai_chatgpt','ai_gemini','ai_claude','ai_perplexity','ai_copilot','ai_other','naver','google','sns_instagram','sns_youtube','sns_blog','direct','referral','other') NOT NULL DEFAULT 'other',
	`referrer` varchar(2048),
	`landing_page` varchar(2048) NOT NULL,
	`page_url` varchar(2048) NOT NULL,
	`page_title` varchar(500),
	`device_type` enum('desktop','mobile','tablet') NOT NULL DEFAULT 'desktop',
	`country` varchar(10),
	`duration` int DEFAULT 0,
	`visited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sns_contents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('caption','promotion','guide') NOT NULL,
	`input` text NOT NULL,
	`output` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sns_contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatment_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`hospital_id` int,
	`slug` varchar(200) NOT NULL,
	`treatment_name` varchar(200) NOT NULL,
	`treatment_category` varchar(100),
	`hero_title` varchar(500),
	`hero_subtitle` varchar(500),
	`hero_description` text,
	`hero_image_url` text,
	`sections` json,
	`seo_title` varchar(200),
	`seo_description` varchar(500),
	`seo_keywords` text,
	`theme_color` varchar(20) DEFAULT '#6B46C1',
	`cta_phone` varchar(30),
	`cta_kakao` varchar(200),
	`cta_naver` varchar(200),
	`hospital_name` varchar(200),
	`hospital_logo` text,
	`doctor_name` varchar(100),
	`doctor_title` varchar(200),
	`doctor_image_url` text,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`view_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treatment_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `treatment_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`page` varchar(500),
	`metadata` text,
	`session_id` varchar(64),
	`visitor_id` varchar(64),
	`user_id` int,
	`ip_hash` varchar(64),
	`user_agent` varchar(500),
	`referrer` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(100) NOT NULL,
	`hospital_id` int,
	`treatment_name` varchar(200) NOT NULL,
	`video_type` varchar(50) NOT NULL,
	`target_platform` varchar(50),
	`prompt` text NOT NULL,
	`script` text,
	`duration` varchar(30),
	`style` varchar(100),
	`music_suggestion` text,
	`hashtags` text,
	`status` varchar(30) NOT NULL DEFAULT 'generated',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_prompts_id` PRIMARY KEY(`id`)
);
