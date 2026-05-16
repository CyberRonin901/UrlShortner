package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.repo.UrlRepo;
import com.cyberronin.url_shortner.service.CleanupService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class CleanupServiceTest {

    @Mock
    private UrlRepo repository;

    @InjectMocks
    private CleanupService cleanupService;

    @Nested
    class PurgeExpiredLinksTests {

        @Test
        void purgeExpiredLinks_ShouldCallRepositoryToDeleteExpiredUrls() {
            // GIVEN: No specific setup needed for the mock as it's a void method
            
            // WHEN: executing the logic
            cleanupService.purgeExpiredLinks();

            // THEN: expect this result
            verify(repository, times(1)).deleteExpiredUrls(any(LocalDateTime.class));
        }
    }
}
