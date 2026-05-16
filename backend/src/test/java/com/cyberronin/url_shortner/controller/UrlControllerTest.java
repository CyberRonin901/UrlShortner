package com.cyberronin.url_shortner.controller;

import com.cyberronin.url_shortner.controller.UrlController;
import com.cyberronin.url_shortner.dto.RequestShortUrl;
import com.cyberronin.url_shortner.dto.RequestUrl;
import com.cyberronin.url_shortner.dto.ResponseUrl;
import com.cyberronin.url_shortner.model.ShortUrl;
import com.cyberronin.url_shortner.service.UrlService;
import com.cyberronin.url_shortner.validator.RequestValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UrlControllerTest {

    @Mock
    private UrlService urlService;

    @Mock
    private RequestValidator requestValidator;

    @InjectMocks
    private UrlController urlController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(urlController, "BASE_URL", "http://localhost:8080");
    }

    @Nested
    class ShortenUrlTests {

        @Test
        void shortenUrl_ShouldReturnEncodedUrl() {
            // GIVEN: some input is given
            RequestUrl requestUrl = new RequestUrl("https://google.com", "google");
            String expectedUrl = "http://localhost:8080/abc/google";
            when(urlService.shortenUrl(requestUrl.url(), requestUrl.alias())).thenReturn(expectedUrl);

            // WHEN: executing the logic
            ResponseEntity<Map<String, String>> response = urlController.shortenUrl(requestUrl);

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(expectedUrl, response.getBody().get("url"));
            verify(requestValidator, times(1)).validateShortenRequestInput(requestUrl);
        }
    }

    @Nested
    class GetShortUrlDataTests {

        @Test
        void getShortUrlData_ShouldReturnResponseUrl() {
            // GIVEN: some input is given
            RequestShortUrl request = new RequestShortUrl("abc", "google");
            ShortUrl shortUrlObj = new ShortUrl();
            shortUrlObj.setUrl("https://google.com");
            shortUrlObj.setCreatedAt(LocalDateTime.now());
            shortUrlObj.setExpiresAt(LocalDateTime.now().plusMonths(1));
            shortUrlObj.setRequestCount(10);
            
            when(urlService.getShortUrlObjByIdAndAlias(request.url_id(), request.alias())).thenReturn(shortUrlObj);

            // WHEN: executing the logic
            ResponseEntity<ResponseUrl> response = urlController.getShortUrlData(request);

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            ResponseUrl body = response.getBody();
            assertNotNull(body);
            assertEquals("http://localhost:8080/abc/google", body.shortUrl());
            assertEquals(shortUrlObj.getUrl(), body.fullUrl());
            assertEquals(shortUrlObj.getRequestCount(), body.requestCount());
        }
    }

    @Nested
    class RedirectToFullUrlTests {

        @Test
        void redirectToFullUrl_ShouldReturnRedirectStatus() {
            // GIVEN: some input is given
            String id = "abc";
            String alias = "google";
            String fullUrl = "https://google.com";
            when(urlService.getFullUrl(id, alias)).thenReturn(fullUrl);

            // WHEN: executing the logic
            ResponseEntity<Void> response = urlController.redirectToFullUrl(id, alias);

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.TEMPORARY_REDIRECT, response.getStatusCode());
            assertEquals(fullUrl, response.getHeaders().getLocation().toString());
        }
    }

    @Nested
    class DeleteUrlTests {

        @Test
        void deleteUrl_ShouldReturnNoContent() {
            // GIVEN: some input is given
            String id = "abc";
            String alias = "google";

            // WHEN: executing the logic
            ResponseEntity<Void> response = urlController.deleteUrl(id, alias);

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
            verify(urlService, times(1)).deleteUrl(id, alias);
        }
    }
}
