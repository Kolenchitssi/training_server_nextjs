-- CreateTable
CREATE TABLE "post_images" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "post_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_post_images_post_id" ON "post_images"("post_id");

-- AddForeignKey
ALTER TABLE "post_images"
ADD CONSTRAINT "post_images_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
