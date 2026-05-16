package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.service.StatsService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
public class StatsServiceTest {

    @InjectMocks
    private StatsService statsService;

    @Nested
    class IncrementTotalRequestCountTests {

        @Test
        void incrementTotalRequestCount_ShouldIncrementByOne() {
            // GIVEN: Initial count is 0
            assertEquals(0, statsService.getTotalRequestCount());

            // WHEN: executing the logic
            long newCount = statsService.incrementTotalRequestCount();

            // THEN: expect this result
            assertEquals(1, newCount);
            assertEquals(1, statsService.getTotalRequestCount());
        }
    }

    @Nested
    class IncrementRedirectCountTests {

        @Test
        void incrementRedirectCount_ShouldIncrementByOne() {
            // GIVEN: Initial count is 0
            assertEquals(0, statsService.getRedirectCount());

            // WHEN: executing the logic
            long newCount = statsService.incrementRedirectCount();

            // THEN: expect this result
            assertEquals(1, newCount);
            assertEquals(1, statsService.getRedirectCount());
        }
    }
}
