import {
  RekognitionClient,
  IndexFacesCommand,
  DeleteFacesCommand,
} from "@aws-sdk/client-rekognition";
import type { IndexFacesCommandOutput } from "@aws-sdk/client-rekognition";

// Minimal Bindings subset for typing without importing app types
export interface AwsEnv {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_REKOGNITION_COLLECTION: string;
}

export function createRekognition(env: AwsEnv) {
  const client = new RekognitionClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export async function indexFaceBytes(params: {
  client: RekognitionClient;
  collectionId: string;
  bytes: Uint8Array;
  externalImageId: string;
}) {
  const command = new IndexFacesCommand({
    CollectionId: params.collectionId,
    Image: { Bytes: params.bytes },
    ExternalImageId: params.externalImageId,
    DetectionAttributes: ["DEFAULT"],
    QualityFilter: "AUTO",
  });

  const out: IndexFacesCommandOutput = await params.client.send(command);
  const record = out.FaceRecords?.[0];
  const face = record?.Face;
  if (!face?.FaceId) {
    throw new Error("No face indexed (ensure a clear single face is present)");
  }
  return {
    faceId: face.FaceId,
    qualityScore: record?.FaceDetail?.Quality?.Sharpness,
    boundingBox: face.BoundingBox,
  } as const;
}

export async function deleteFaces(params: {
  client: RekognitionClient;
  collectionId: string;
  faceIds: string[];
}) {
  if (params.faceIds.length === 0) return { deleted: 0 } as const;
  const command = new DeleteFacesCommand({
    CollectionId: params.collectionId,
    FaceIds: params.faceIds,
  });
  const out = await params.client.send(command);
  return { deleted: out.DeletedFaces?.length ?? 0 } as const;
}
