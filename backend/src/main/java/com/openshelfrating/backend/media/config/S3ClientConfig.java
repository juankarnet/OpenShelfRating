package com.openshelfrating.backend.media.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3ClientConfig {

    @Bean
    public S3Client s3Client(MediaProperties mediaProperties) {
        MediaProperties.S3 s3 = mediaProperties.getS3();

        return S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey())))
                .region(Region.of(s3.getRegion()))
                .endpointOverride(URI.create(s3.getEndpoint()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(MediaProperties mediaProperties) {
        MediaProperties.S3 s3 = mediaProperties.getS3();

        return S3Presigner.builder()
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey())))
                .region(Region.of(s3.getRegion()))
                .endpointOverride(URI.create(s3.getEndpoint()))
                .build();
    }
}
