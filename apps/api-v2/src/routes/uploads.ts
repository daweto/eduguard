import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import type { Bindings } from "../types";

const uploads = new Hono<{ Bindings: Bindings }>();

// POST /api/uploads/presign
// Body: { purpose: 'student_photo' | 'attendance_photo', count: number, contentType?: string }
uploads.post("/presign", async (c) => {
  try {
    const body = await c.req.json<{
      purpose: "student_photo" | "attendance_photo";
      count?: number;
      contentType?: string;
    }>();
    
    // Validate purpose
    if (!["student_photo", "attendance_photo"].includes(body.purpose)) {
      return c.json({ error: "Invalid purpose. Must be 'student_photo' or 'attendance_photo'" }, 400);
    }
    
    // Validate content type is an image
    const contentType = body.contentType ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return c.json({ error: "Invalid content type. Must be an image" }, 400);
    }
    
    // Different limits based on purpose
    const maxCount = body.purpose === "attendance_photo" ? 10 : 3;
    const count = Math.min(Math.max(body.count ?? 1, 1), maxCount);

    const accountId = c.env.R2_ACCOUNT_ID;
    const bucket = c.env.R2_BUCKET_NAME;
    const accessKeyId = c.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = c.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      console.log('[UPLOADS] R2 presign env not configured');
      return c.json({ error: "R2 presign env not configured" }, 500);
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const now = new Date().toISOString().slice(0, 10);
    const uuid = crypto.randomUUID();
    
    // Different path prefixes based on purpose
    const basePrefix = body.purpose === "attendance_photo"
      ? `uploads/tmp/attendance/${now}/${uuid}`
      : `uploads/tmp/${now}/${uuid}`;

    const items = await Promise.all(
      Array.from({ length: count }).map(async (_, idx) => {
        // Infer file extension from content type
        const ext = contentType.split('/')[1]?.split('+')[0] || 'jpg';
        const key = `${basePrefix}/photo-${String(idx + 1)}.${ext}`;
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutes
        return { key, upload_url: url, content_type: contentType };
      }),
    );

    return c.json({ bucket, uploads: items });
  } catch (err: unknown) {
    console.error("presign error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default uploads;
