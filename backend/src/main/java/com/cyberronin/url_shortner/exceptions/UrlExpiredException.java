package com.cyberronin.url_shortner.exceptions;

import java.time.LocalDateTime;

public class UrlExpiredException extends RuntimeException {

    private final LocalDateTime expirationDate;

    public UrlExpiredException(LocalDateTime expirationDate) {
        super(String.format("URL expired at [%s]. Access is no longer permitted.", expirationDate));
        this.expirationDate = expirationDate;
    }

    public LocalDateTime getExpirationDate() {
        return expirationDate;
    }
}