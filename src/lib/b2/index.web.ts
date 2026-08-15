import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';

const B2_KEY_ID = process.env.EXPO_PUBLIC_B2_KEY_ID?.trim();
const B2_APPLICATION_KEY = process.env.EXPO_PUBLIC_B2_APPLICATION_KEY?.trim();
const B2_ENDPOINT = process.env.EXPO_PUBLIC_B2_ENDPOINT?.trim();
const B2_BUCKET_NAME = process.env.EXPO_PUBLIC_B2_BUCKET_NAME?.trim();

export const uploadToB2 = async (uri: string, fileName: string, contentType: string) => {
    if (!B2_KEY_ID || !B2_APPLICATION_KEY || !B2_ENDPOINT || !B2_BUCKET_NAME) {
        throw new Error('Missing B2 configuration in environment variables');
    }

    try {
        const region = (B2_ENDPOINT.includes('s3.')
            ? B2_ENDPOINT.split('.')[1]
            : (B2_ENDPOINT.split('.')[0].includes('s3-') ? B2_ENDPOINT.split('.')[0] : 'us-east-1')).toLowerCase();

        const s3Client = new S3Client({
            region: region,
            endpoint: `https://${B2_ENDPOINT}`,
            credentials: {
                accessKeyId: B2_KEY_ID,
                secretAccessKey: B2_APPLICATION_KEY,
            },
            forcePathStyle: true,
        });

        const key = `badges/${Date.now()}-${fileName}`;

        let body: Uint8Array;
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            body = new Uint8Array(arrayBuffer);
        } else {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64
            });
            body = new Uint8Array(Buffer.from(base64, 'base64'));
        }

        console.log('Uploading to B2:', { fileName, contentType, bucket: B2_BUCKET_NAME, region });

        await s3Client.send(new PutObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));

        // Construct public URL using the S3-compatible format
        // Format: https://<bucket-name>.<endpoint>/<key>
        const publicUrl = `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${key}`;

        console.log('B2 Upload Success:', publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('B2 Upload Error Details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            requestId: error.$metadata?.requestId,
            cfId: error.$metadata?.cfId,
            extendedRequestId: error.$metadata?.extendedRequestId,
            statusCode: error.$metadata?.httpStatusCode,
            fault: error.fault,
            stack: error.stack
        });

        if (error.Code === 'SignatureDoesNotMatch') {
            console.error('Signature mismatch! Check region and clock.');
        }

        throw error;
    }
};