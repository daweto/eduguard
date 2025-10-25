// R2 storage utilities

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
