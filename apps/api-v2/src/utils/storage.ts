// R2 storage utilities
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadPhoto(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string = 'image/jpeg'
): Promise<void> {
  await bucket.put(key, data, {
    httpMetadata: {
      contentType,
    },
  });
}

export async function getPhotoUrl(bucket: R2Bucket, key: string): Promise<string | null> {
  const object = await bucket.get(key);
  if (!object) return null;

  // For local development, we'll return a data URL
  // In production, you'd generate a presigned URL or use R2 public bucket
  return key;
}

export async function generatePresignedUrl(
  key: string,
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    expiresIn?: number;
  }
): Promise<string> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return await getSignedUrl(s3, command, { 
    expiresIn: config.expiresIn ?? 60 * 60 // 1 hour default
  });
}

export async function generatePresignedUrls(
  keys: string[],
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    expiresIn?: number;
  }
): Promise<string[]> {
  return await Promise.all(
    keys.map(key => generatePresignedUrl(key, config))
  );
}

export async function deletePhoto(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Remove data:image/...;base64, prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Fetch an object from remote R2 bucket using S3 client
 * Used for retrieving presigned uploads before moving them to final destination
 */
export async function fetchFromRemoteR2(
  key: string,
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
  }
): Promise<Uint8Array | null> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const response = await s3.send(command);
    if (!response.Body) return null;

    // Convert ReadableStream to Uint8Array
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    let readResult;
    while ((readResult = await reader.read(), !readResult.done)) {
      chunks.push(readResult.value as Uint8Array);
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    console.error(`Failed to fetch from remote R2: ${key}`, error);
    return null;
  }
}

/**
 * Delete an object from remote R2 bucket using S3 client
 */
export async function deleteFromRemoteR2(
  key: string,
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
  }
): Promise<void> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    await s3.send(command);
  } catch (error) {
    console.error(`Failed to delete from remote R2: ${key}`, error);
  }
}

/**
 * Upload photo to remote R2 bucket using S3 client
 * Used when we need to store in remote bucket (e.g., when using presigned uploads)
 */
export async function uploadToRemoteR2(
  key: string,
  data: ArrayBuffer,
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
  },
  contentType: string = 'image/jpeg'
): Promise<void> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: new Uint8Array(data),
    ContentType: contentType,
  });

  await s3.send(command);
}

