import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // 2. Parse the incoming request for file metadata
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "File name and type are required." },
        { status: 400 }
      );
    }

    // 3. Define the S3 parameters
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    // 4. Generate the Presigned URL (valid for 5 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // 5. Return the URL to the frontend
    return NextResponse.json({ url: signedUrl });
    
  } catch (error) {
    console.error("S3 Presigning Error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL." },
      { status: 500 }
    );
  }
}