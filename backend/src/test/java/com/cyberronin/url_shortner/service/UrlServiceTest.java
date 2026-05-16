package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.exceptions.AliasMismatchException;
import com.cyberronin.url_shortner.exceptions.UrlExpiredException;
import com.cyberronin.url_shortner.exceptions.UrlNotFoundException;
import com.cyberronin.url_shortner.model.ShortUrl;
import com.cyberronin.url_shortner.repo.UrlRepo;
import com.cyberronin.url_shortner.service.UrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UrlServiceTest {

    @Mock
    private UrlRepo urlRepo;

    @InjectMocks
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(urlService, "BASE_URL", "http://localhost:8080");
    }

    @Nested
    class ShortenUrlTests {
        
        @Test
        void shortenUrl_WhenUrlAndAliasNotExist_ShouldCreateAndReturnShortUrl() {
            // GIVEN: some input is given
            String url = "https://example.com";
            String alias = "myalias";
            when(urlRepo.findByUrlAndAlias(url, alias)).thenReturn(Optional.empty());
            
            ShortUrl savedUrl = new ShortUrl();
            savedUrl.setId(1);
            savedUrl.setUrl(url);
            savedUrl.setAlias(alias);
            when(urlRepo.save(any(ShortUrl.class))).thenAnswer(invocation -> {
                ShortUrl arg = invocation.getArgument(0);
                arg.setId(1);
                return arg;
            });

            // WHEN: executing the logic
            String result = urlService.shortenUrl(url, alias);

            // THEN: expect this result
            assertNotNull(result);
            verify(urlRepo, times(1)).findByUrlAndAlias(url, alias);
            verify(urlRepo, times(1)).save(any(ShortUrl.class));
            String expectedEncodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            assertEquals("http://localhost:8080/" + expectedEncodedId + "/" + alias, result);
        }

        @Test
        void shortenUrl_WhenUrlExists_ShouldUpdateExpiryAndReturnShortUrl() {
            // GIVEN: some input is given
            String url = "https://example.com";
            String alias = null;
            ShortUrl existingUrl = new ShortUrl();
            existingUrl.setId(2);
            existingUrl.setUrl(url);
            existingUrl.setAlias(alias);
            when(urlRepo.findByUrlAndAlias(url, alias)).thenReturn(Optional.of(existingUrl));

            // WHEN: executing the logic
            String result = urlService.shortenUrl(url, alias);

            // THEN: expect this result
            assertNotNull(result);
            verify(urlRepo, times(1)).findByUrlAndAlias(url, alias);
            verify(urlRepo, times(1)).save(existingUrl);
            String expectedEncodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("2".getBytes());
            assertEquals("http://localhost:8080/" + expectedEncodedId, result);
        }
    }

    @Nested
    class GetShortUrlObjByIdAndAliasTests {

        @Test
        void getShortUrlObjByIdAndAlias_WhenIdNotFound_ShouldThrowUrlNotFoundException() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            when(urlRepo.findById(1)).thenReturn(Optional.empty());

            // WHEN / THEN: expect this result
            assertThrows(UrlNotFoundException.class, () -> urlService.getShortUrlObjByIdAndAlias(encodedId, null));
            verify(urlRepo, times(1)).findById(1);
        }

        @Test
        void getShortUrlObjByIdAndAlias_WhenUrlExpired_ShouldThrowUrlExpiredException() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setExpiresAt(LocalDateTime.now().minusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN / THEN: expect this result
            assertThrows(UrlExpiredException.class, () -> urlService.getShortUrlObjByIdAndAlias(encodedId, null));
        }

        @Test
        void getShortUrlObjByIdAndAlias_WhenAliasMismatches_ShouldThrowAliasMismatchException() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setAlias("storedAlias");
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN / THEN: expect this result
            assertThrows(AliasMismatchException.class, () -> urlService.getShortUrlObjByIdAndAlias(encodedId, "wrongAlias"));
        }

        @Test
        void getShortUrlObjByIdAndAlias_WhenStoredAliasEmptyAndProvidedNotEmpty_ShouldThrowAliasMismatchException() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setAlias("");
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN / THEN: expect this result
            assertThrows(AliasMismatchException.class, () -> urlService.getShortUrlObjByIdAndAlias(encodedId, "providedAlias"));
        }

        @Test
        void getShortUrlObjByIdAndAlias_WhenValid_ShouldReturnUrl() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            String alias = "myalias";
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setAlias(alias);
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN: executing the logic
            ShortUrl result = urlService.getShortUrlObjByIdAndAlias(encodedId, alias);

            // THEN: expect this result
            assertNotNull(result);
            assertEquals(1, result.getId());
            verify(urlRepo, times(1)).findById(1);
        }
    }

    @Nested
    class GetFullUrlTests {

        @Test
        void getFullUrl_ShouldIncrementCountAndUpdateExpiry() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            String alias = "myalias";
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setUrl("https://example.com");
            shortUrl.setAlias(alias);
            shortUrl.setRequestCount(5);
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN: executing the logic
            String fullUrl = urlService.getFullUrl(encodedId, alias);

            // THEN: expect this result
            assertEquals("https://example.com", fullUrl);
            assertEquals(6, shortUrl.getRequestCount());
            verify(urlRepo, times(1)).save(shortUrl);
        }
    }

    @Nested
    class DeleteUrlTests {

        @Test
        void deleteUrl_ShouldCallDeleteOnRepository() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN: executing the logic
            urlService.deleteUrl(encodedId, null);

            // THEN: expect this result
            verify(urlRepo, times(1)).delete(shortUrl);
        }
    }

    @Nested
    class GetRequestCountTests {

        @Test
        void getRequestCount_ShouldReturnCount() {
            // GIVEN: some input is given
            String encodedId = Base64.getUrlEncoder().withoutPadding().encodeToString("1".getBytes());
            ShortUrl shortUrl = new ShortUrl();
            shortUrl.setId(1);
            shortUrl.setRequestCount(42);
            shortUrl.setExpiresAt(LocalDateTime.now().plusDays(1));
            when(urlRepo.findById(1)).thenReturn(Optional.of(shortUrl));

            // WHEN: executing the logic
            int count = urlService.getRequestCount(encodedId, null);

            // THEN: expect this result
            assertEquals(42, count);
        }
    }
}
