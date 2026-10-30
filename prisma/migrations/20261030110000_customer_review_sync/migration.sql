ALTER TABLE "sessions"
  ADD COLUMN "customerRatingHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "adminReviewSyncedAt" TIMESTAMP(3),
  ADD COLUMN "adminReviewSyncAttemptedAt" TIMESTAMP(3);

CREATE INDEX "sessions_pending_admin_review_sync_idx"
  ON "sessions" ("updatedAt")
  WHERE "customerRating" IS NOT NULL AND "adminReviewSyncedAt" IS NULL;
