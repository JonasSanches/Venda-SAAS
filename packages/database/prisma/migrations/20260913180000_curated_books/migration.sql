CREATE TABLE "curated_books" (
  "id" UUID NOT NULL,
  "source" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "year" TEXT,
  "license" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "cover_url" TEXT NOT NULL,
  "pdf_url" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "curated_books_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curated_books_external_id_key" ON "curated_books"("external_id");
CREATE INDEX "curated_books_score_discovered_at_idx" ON "curated_books"("score", "discovered_at");
