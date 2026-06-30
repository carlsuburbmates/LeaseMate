ALTER TABLE `provider_profiles` ADD `approvalMode` enum('auto','manual') DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `eligibilityStatus` enum('eligible','ineligible','needs_review') DEFAULT 'ineligible' NOT NULL;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `eligibilityChecks` json;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `lastEligibilityEvaluatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `autoApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `approvalReason` text;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD `rejectionReason` text;