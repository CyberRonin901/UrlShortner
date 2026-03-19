package com.cyberronin.url_shortner.dto;

import java.time.LocalDateTime;

public record ResponseUrl (
        String shortUrl,
        String fullUrl,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        int requestCount
    ) { }
