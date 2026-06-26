package com.openshelfrating.backend.auth.service;

import com.openshelfrating.backend.auth.config.AuthProperties;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class JwtKeyPairProvider {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    public JwtKeyPairProvider(AuthProperties authProperties) {
        try {
            String privatePem = trimToNull(authProperties.getJwtPrivateKeyPem());
            String publicPem = trimToNull(authProperties.getJwtPublicKeyPem());

            if (privatePem != null && publicPem != null) {
                this.privateKey = (RSAPrivateKey) parsePrivateKey(privatePem);
                this.publicKey = (RSAPublicKey) parsePublicKey(publicPem);
                return;
            }

            KeyPair keyPair = generateKeyPair();
            this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
            this.publicKey = (RSAPublicKey) keyPair.getPublic();
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to initialize JWT RSA key pair", ex);
        }
    }

    public RSAPrivateKey getPrivateKey() {
        return privateKey;
    }

    public RSAPublicKey getPublicKey() {
        return publicKey;
    }

    private static KeyPair generateKeyPair() throws GeneralSecurityException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static PrivateKey parsePrivateKey(String privateKeyPem) throws GeneralSecurityException {
        byte[] keyBytes = pemToDer(privateKeyPem, "PRIVATE KEY");
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private static PublicKey parsePublicKey(String publicKeyPem) throws GeneralSecurityException {
        byte[] keyBytes = pemToDer(publicKeyPem, "PUBLIC KEY");
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(new X509EncodedKeySpec(keyBytes));
    }

    private static byte[] pemToDer(String pem, String blockType) {
        String begin = "-----BEGIN " + blockType + "-----";
        String end = "-----END " + blockType + "-----";
        String sanitized = pem
                .replace(begin, "")
                .replace(end, "")
                .replace("\r", "")
                .replace("\n", "")
                .replace(" ", "")
                .trim();
        return Base64.getDecoder().decode(sanitized.getBytes(StandardCharsets.UTF_8));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
