import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/lib/image-compresser";

// 1. Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const key = `supplier/products/${uniqueFileName}`;

  const processed = await compressImage(buffer);

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: processed.buffer,
    ContentType: processed.contentType,
    CacheControl: "max-age=31536000",
    Metadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  };

  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse FormData instead of JSON
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const url = await uploadToS3(buffer, file.name, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 },
    );
  }
}
