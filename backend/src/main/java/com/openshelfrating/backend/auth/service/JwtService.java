package com.openshelfrating.backend.auth.service;

import com.openshelfrating.backend.auth.config.AuthProperties;
import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtKeyPairProvider keyPairProvider;
    private final AuthProperties authProperties;

    public JwtService(JwtKeyPairProvider keyPairProvider, AuthProperties authProperties) {
        this.keyPairProvider = keyPairProvider;
        this.authProperties = authProperties;
    }

    public TokenResult generateToken(UserAccount user) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime expiresAt = now.plusHours(authProperties.getJwtExpirationHours());

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issueTime(Date.from(now.toInstant()))
                .expirationTime(Date.from(expiresAt.toInstant()))
                .claim("user_id", user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsSet
        );

        try {
            signedJWT.sign(new RSASSASigner(keyPairProvider.getPrivateKey()));
        } catch (JOSEException ex) {
            throw new IllegalStateException("Unable to sign JWT", ex);
        }

        return new TokenResult(signedJWT.serialize(), expiresAt);
    }

    public JwtPayload parseAndValidate(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            boolean validSignature = signedJWT.verify(new RSASSAVerifier(keyPairProvider.getPublicKey()));
            if (!validSignature) {
                throw new AuthException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid token signature");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime == null || expirationTime.before(new Date())) {
                throw new AuthException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Token expired");
            }

            String userId = claims.getStringClaim("user_id");
            String email = claims.getStringClaim("email");
            String role = claims.getStringClaim("role");
            return new JwtPayload(UUID.fromString(userId), email, UserRole.valueOf(role));
        } catch (ParseException | JOSEException ex) {
            throw new AuthException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid token payload");
        }
    }

    public record TokenResult(String token, OffsetDateTime expiresAt) {
    }

    public record JwtPayload(UUID userId, String email, UserRole role) {
    }
}
