import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import type { Bindings } from "../types";

const uploads = new Hono<{ Bindings: Bindings }>();

// POST /api/uploads/presign
// Body: { purpose: 'student_photo', count: number, contentType?: string }
uploads.post("/presign", async (c) => {
  try {
    const body = await c.req.json<{
      purpose: "student_photo";
      count?: number;
      contentType?: string;
    }>();
    const count = Math.min(Math.max(body.count ?? 1, 1), 3);
    const contentType = body.contentType ?? "image/jpeg";

    const accountId = c.env.R2_ACCOUNT_ID;
    const bucket = c.env.R2_BUCKET_NAME;
    const accessKeyId = c.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = c.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
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
    const basePrefix = `uploads/tmp/${now}/${crypto.randomUUID()}`;

    const items = await Promise.all(
      Array.from({ length: count }).map(async (_, idx) => {
        const key = `${basePrefix}/photo-${String(idx + 1)}.jpg`;
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
