package com.tripnest.tripnest.util;

import com.tripnest.tripnest.exception.TripValidationException;

public class PasswordPolicyValidator {

    public static final String PASSWORD_POLICY_MESSAGE =
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.";

    public static void validate(String password) {
        if (password == null || password.length() < 8) {
            throw new TripValidationException(PASSWORD_POLICY_MESSAGE);
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpper = true;
            } else if (Character.isLowerCase(c)) {
                hasLower = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else {
                hasSpecial = true;
            }
        }

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new TripValidationException(PASSWORD_POLICY_MESSAGE);
        }
    }
}
