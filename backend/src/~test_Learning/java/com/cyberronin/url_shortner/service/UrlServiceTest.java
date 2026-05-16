package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.exceptions.UrlExpiredException;
import com.cyberronin.url_shortner.model.ShortUrl;
import com.cyberronin.url_shortner.repo.UrlRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
/*
@DisplayName() works on both class level and method level
*/

@ExtendWith(MockitoExtension.class)
@DisplayName("UrlServiceImpl Unit Tests")
class UrlServiceTest
{
    @Mock
    private UrlRepo urlRepo;

    private final String BASE_URL = "null";

    @InjectMocks
    private UrlService urlService;

    @BeforeEach
    void setUp(){
        // perform some action before each @Test method is called
    }

    @Nested
    @DisplayName("Validate expiry date tests")
    class validateExpiryDateTests{
        // param: LocalDateTime expiryDate
        // Expiry date could be: null, before current time (invalid), after current time (valid)
        // valid -> returns true
        // invalid -> throws exception UrlExpiredException

        @Test
        @DisplayName("Argument is valid, should return true")
        void futureDate_returnsTrue(){
            // Given
            LocalDateTime expiryDate = LocalDateTime.now().plusHours(2);

            // When
            final var result = ReflectionTestUtils.invokeMethod(urlService, "validateExpiryDate", expiryDate);

            // Then
            assertEquals(true, result);
        }

        @Test
        @DisplayName("Argument invalid, throw UrlExpiredException")
        void pastDate_throwsUrlExpiredException(){
            LocalDateTime expiryDate = LocalDateTime.now().minusHours(2);

            final UrlExpiredException exception = assertThrows(UrlExpiredException.class, () ->
                ReflectionTestUtils.invokeMethod(urlService, "validateExpiryDate", expiryDate)
            );

            assertEquals("URL expired at [" + expiryDate + "]. Access is no longer permitted.",
                    exception.getMessage()
            );
        }

        @Test
        @DisplayName("Args null, throw UrlExpiredException")
        void nullDate_throwsNullPointerException(){
            final NullPointerException exception = assertThrows(NullPointerException.class, () ->
                ReflectionTestUtils.invokeMethod(urlService, "validateExpiryDate", (Object) null)
            );
        }
    }


    @Test
    @DisplayName("Validate encoding of url id")
    void validateEncoding(){
        int id = 1234;

        String result = ReflectionTestUtils.invokeMethod(urlService, "encodeId", id);

        assertNotNull(result);
    }

    @Nested
    @DisplayName("Test Url shortening by providing full url and alias")
    class validateShortenURL
    {
        @Test
        @DisplayName("Validate Shorten url by giving full url and alias, not found in DB")
        void validateNotFoundINnDB(){
            String url = "https://youtube.com";
            String alias = "yt";

            when(urlRepo.findByUrlAndAlias(url, alias))
                    .thenReturn(Optional.empty());

            when(urlRepo.save(any(ShortUrl.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            String result = urlService.shortenUrl(url, alias);

            assertNotNull(result);

            verify(urlRepo, times(1)).findByUrlAndAlias(url, alias);
        }

        @Test
        @DisplayName("Validate shorten url, record found in DB for that url and alias")
        void validateFoundInDB(){
            final String url = "https://youtube.com";
            final String alias = "yt";
            final LocalDateTime now = LocalDateTime.now();
            final int dbIndex = 1;

            when(urlRepo.findByUrlAndAlias(url, alias))
                .thenReturn(Optional.of(
                    new ShortUrl(dbIndex, url, now.minusHours(1), now.plusMonths(1).minusHours(1), 2, alias)
                ));

            // When saving, return the arg as is
            when(urlRepo.save(any(ShortUrl.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            String result = urlService.shortenUrl(url, alias);

            assertEquals(BASE_URL + "/MQ/yt", result);
        }
    }


}