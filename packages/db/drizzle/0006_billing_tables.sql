CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text NOT NULL,
	"amount" bigint NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_url" text,
	"ipaymu_session_id" text,
	"ipaymu_trx_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'ipaymu' NOT NULL,
	"raw_body" text NOT NULL,
	"parsed_data" jsonb,
	"trx_id" text,
	"status" text DEFAULT 'received' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX "orders_ipaymu_session_idx" ON "orders" USING btree ("ipaymu_session_id");
--> statement-breakpoint
CREATE INDEX "orders_ipaymu_trx_idx" ON "orders" USING btree ("ipaymu_trx_id");
--> statement-breakpoint
CREATE INDEX "webhook_logs_trx_idx" ON "webhook_logs" USING btree ("trx_id");
--> statement-breakpoint
CREATE INDEX "webhook_logs_status_created_idx" ON "webhook_logs" USING btree ("status","created_at");
