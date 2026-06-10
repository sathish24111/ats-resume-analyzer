package com.ats.analyzer.config;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

public class PasswordUtil {

    // Simple robust SHA-256 hashing with secure salt
    public static String hashPassword(String password) {
        try {
            // Generate a secure random salt
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[16];
            random.nextBytes(salt);

            // Hash the password with the salt
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes());

            // Combine salt and hash, and encode in Base64
            byte[] combined = new byte[salt.length + hashedPassword.length];
            System.arraycopy(salt, 0, combined, 0, salt.length);
            System.arraycopy(hashedPassword, 0, combined, salt.length, hashedPassword.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password: " + e.getMessage());
        }
    }

    public static boolean verifyPassword(String password, String storedHash) {
        try {
            // Decode stored base64 hash
            byte[] combined = Base64.getDecoder().decode(storedHash);

            // Extract salt (first 16 bytes)
            byte[] salt = new byte[16];
            System.arraycopy(combined, 0, salt, 0, 16);

            // Extract original hash
            byte[] originalHash = new byte[combined.length - 16];
            System.arraycopy(combined, 16, originalHash, 0, originalHash.length);

            // Hash the input password with the extracted salt
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] computedHash = md.digest(password.getBytes());

            // Compare computed hash with original hash
            if (computedHash.length != originalHash.length) {
                return false;
            }
            
            int result = 0;
            for (int i = 0; i < computedHash.length; i++) {
                result |= computedHash[i] ^ originalHash[i];
            }
            return result == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
