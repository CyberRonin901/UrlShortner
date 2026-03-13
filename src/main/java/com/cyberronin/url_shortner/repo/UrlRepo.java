package com.cyberronin.url_shortner.repo;

import com.cyberronin.url_shortner.model.ShortUrl;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UrlRepo extends JpaRepository<ShortUrl, Integer> {

    Optional<ShortUrl> findByUrl(String url);

    Optional<ShortUrl> findByUrlAndAlias(String url, String alias);

    @Modifying
    @Transactional
    @Query("DELETE FROM ShortUrl s WHERE s.expiresAt <= :now")
    void deleteExpiredUrls(LocalDateTime now);
}