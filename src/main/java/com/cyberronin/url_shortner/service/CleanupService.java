package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.repo.UrlRepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class CleanupService {

    private final UrlRepo repository;

    public CleanupService(UrlRepo repository) {
        this.repository = repository;
    }

    /*
    Removes Expired records everyday to 00:00
    */
    @Scheduled(cron = "0 0 0 * * *")
    public void purgeExpiredLinks() {
        log.info("Starting expired URL cleanup...");
        repository.deleteExpiredUrls(LocalDateTime.now());
        log.info("Cleanup complete.");
    }
}