package com.openshelfrating.backend.media.service;

import java.io.InputStream;
import java.time.Duration;

public interface S3StorageAdapter {

    void uploadFile(String s3Path, InputStream inputStream, long contentLength, String mimeType);

    String generatePresignedGetUrl(String s3Path, Duration expiry);
}
