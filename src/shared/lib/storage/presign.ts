import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3_BUCKET, s3 } from "./s3-client";

export async function createPresignedPutUrl(
	fileKey: string,
	mimeType: string,
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: S3_BUCKET,
		Key: fileKey,
		ContentType: mimeType,
	});
	return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutos
}

export async function createPresignedGetUrl(fileKey: string): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: S3_BUCKET,
		Key: fileKey,
	});
	return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hora
}

export async function headS3Object(fileKey: string): Promise<{
	contentLength: number | null;
	contentType: string | null;
}> {
	const command = new HeadObjectCommand({
		Bucket: S3_BUCKET,
		Key: fileKey,
	});
	const result = await s3.send(command);

	return {
		contentLength: result.ContentLength ?? null,
		contentType: result.ContentType ?? null,
	};
}

export async function deleteS3Object(fileKey: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: S3_BUCKET,
		Key: fileKey,
	});
	await s3.send(command);
}
