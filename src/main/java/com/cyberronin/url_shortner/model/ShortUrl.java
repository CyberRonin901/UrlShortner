package com.cyberronin.url_shortner.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShortUrl
{
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "url_seq")
    @SequenceGenerator(name = "url_seq", initialValue = 10_000)
    private int id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private int requestCount;
    private String alias;
}
