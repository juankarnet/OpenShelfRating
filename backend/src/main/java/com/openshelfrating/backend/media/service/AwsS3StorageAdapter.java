package com.openshelfrating.backend.media.service;

import com.openshelfrating.backend.media.config.MediaProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.time.Duration;

@Component
public class AwsS3StorageAdapter implements S3StorageAdapter {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final MediaProperties mediaProperties;

    public AwsS3StorageAdapter(S3Client s3Client, S3Presigner s3Presigner, MediaProperties mediaProperties) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.mediaProperties = mediaProperties;
    }

    @Override
    public void uploadFile(String s3Path, InputStream inputStream, long contentLength, String mimeType) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(mediaProperties.getS3().getBucketName())
                    .key(s3Path)
                    .contentType(mimeType)
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
        } catch (Exception ex) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "S3 upload failed");
        }
    }

    @Override
    public String generatePresignedGetUrl(String s3Path, Duration expiry) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(mediaProperties.getS3().getBucketName())
                    .key(s3Path)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiry)
                    .getObjectRequest(getObjectRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception ex) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Failed to generate presigned URL");
        }
    }
}
