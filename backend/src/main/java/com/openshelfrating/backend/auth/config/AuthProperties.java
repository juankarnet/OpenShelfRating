package com.openshelfrating.backend.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    private int jwtExpirationHours = 24;
    private int verificationExpirationHours = 24;
    private String baseUrl = "http://localhost:8080";
    private String jwtPrivateKeyPem;
    private String jwtPublicKeyPem;

    public int getJwtExpirationHours() {
        return jwtExpirationHours;
    }

    public void setJwtExpirationHours(int jwtExpirationHours) {
        this.jwtExpirationHours = jwtExpirationHours;
    }

    public int getVerificationExpirationHours() {
        return verificationExpirationHours;
    }

    public void setVerificationExpirationHours(int verificationExpirationHours) {
        this.verificationExpirationHours = verificationExpirationHours;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getJwtPrivateKeyPem() {
        return jwtPrivateKeyPem;
    }

    public void setJwtPrivateKeyPem(String jwtPrivateKeyPem) {
        this.jwtPrivateKeyPem = jwtPrivateKeyPem;
    }

    public String getJwtPublicKeyPem() {
        return jwtPublicKeyPem;
    }

    public void setJwtPublicKeyPem(String jwtPublicKeyPem) {
        this.jwtPublicKeyPem = jwtPublicKeyPem;
    }
}
