-- Make video_url nullable to support image posts
ALTER TABLE "public"."wolfpack_videos" ALTER COLUMN "video_url" DROP NOT NULL;