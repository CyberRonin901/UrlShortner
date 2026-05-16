package com.cyberronin.url_shortner.controller;

import com.cyberronin.url_shortner.controller.StatsController;
import com.cyberronin.url_shortner.service.StatsService;
import com.cyberronin.url_shortner.service.UrlService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class StatsControllerTest {

    @Mock
    private UrlService urlService;

    @Mock
    private StatsService statsService;

    @InjectMocks
    private StatsController statsController;

    @Nested
    class TotalRequestCountTests {

        @Test
        void totalRequestCount_ShouldReturnTotalCount() {
            // GIVEN: some input is given
            when(statsService.getTotalRequestCount()).thenReturn(100L);

            // WHEN: executing the logic
            ResponseEntity<Map<String, Long>> response = statsController.totalRequestCount();

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(100L, response.getBody().get("totalRequestCount"));
        }
    }

    @Nested
    class RequestCountTests {

        @Test
        void requestCount_ShouldReturnUrlRequestCount() {
            // GIVEN: some input is given
            String id = "abc";
            String alias = "google";
            when(urlService.getRequestCount(id, alias)).thenReturn(50);

            // WHEN: executing the logic
            ResponseEntity<Map<String, Integer>> response = statsController.requestCount(id, alias);

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(50, response.getBody().get("requestCount"));
        }
    }

    @Nested
    class RedirectCountTests {

        @Test
        void redirectCount_ShouldReturnTotalRedirectCount() {
            // GIVEN: some input is given
            when(statsService.getRedirectCount()).thenReturn(75L);

            // WHEN: executing the logic
            ResponseEntity<Map<String, Long>> response = statsController.redirectCount();

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(75L, response.getBody().get("redirectCount"));
        }
    }
}
