ALTER TABLE `move_request_items` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `service_products` MODIFY COLUMN `coverageZones` json;--> statement-breakpoint
ALTER TABLE `service_products` MODIFY COLUMN `propertyTypes` json;