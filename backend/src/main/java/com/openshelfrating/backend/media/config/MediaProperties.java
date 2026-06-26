package com.openshelfrating.backend.media.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.media")
public class MediaProperties {

    private List<String> allowedMimeTypes = List.of("image/jpeg", "image/png", "image/webp");
    private long maxAvatarSize = 5 * 1024 * 1024;
    private long maxCoverSize = 10 * 1024 * 1024;
    private long presignedUrlExpiryHours = 24;
    private long cacheMaxAgeSeconds = 86400;
    private String avatarPlaceholderUrl = "https://placehold.co/256x256?text=avatar";
    private String coverPlaceholderUrl = "https://placehold.co/512x768?text=cover";
    private final S3 s3 = new S3();

    public static class S3 {
        private String bucketName = "openshelfrating-media";
        private String region = "us-east-1";
        private String endpoint = "http://localhost:9000";
        private String accessKey = "minioadmin";
        private String secretKey = "minioadmin";

        public String getBucketName() {
            return bucketName;
        }

        public void setBucketName(String bucketName) {
            this.bucketName = bucketName;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }
    }

    public List<String> getAllowedMimeTypes() {
        return allowedMimeTypes;
    }

    public void setAllowedMimeTypes(List<String> allowedMimeTypes) {
        this.allowedMimeTypes = allowedMimeTypes;
    }

    public long getMaxAvatarSize() {
        return maxAvatarSize;
    }

    public void setMaxAvatarSize(long maxAvatarSize) {
        this.maxAvatarSize = maxAvatarSize;
    }

    public long getMaxCoverSize() {
        return maxCoverSize;
    }

    public void setMaxCoverSize(long maxCoverSize) {
        this.maxCoverSize = maxCoverSize;
    }

    public long getPresignedUrlExpiryHours() {
        return presignedUrlExpiryHours;
    }

    public void setPresignedUrlExpiryHours(long presignedUrlExpiryHours) {
        this.presignedUrlExpiryHours = presignedUrlExpiryHours;
    }

    public long getCacheMaxAgeSeconds() {
        return cacheMaxAgeSeconds;
    }

    public void setCacheMaxAgeSeconds(long cacheMaxAgeSeconds) {
        this.cacheMaxAgeSeconds = cacheMaxAgeSeconds;
    }

    public String getAvatarPlaceholderUrl() {
        return avatarPlaceholderUrl;
    }

    public void setAvatarPlaceholderUrl(String avatarPlaceholderUrl) {
        this.avatarPlaceholderUrl = avatarPlaceholderUrl;
    }

    public String getCoverPlaceholderUrl() {
        return coverPlaceholderUrl;
    }

    public void setCoverPlaceholderUrl(String coverPlaceholderUrl) {
        this.coverPlaceholderUrl = coverPlaceholderUrl;
    }

    public S3 getS3() {
        return s3;
    }
}
