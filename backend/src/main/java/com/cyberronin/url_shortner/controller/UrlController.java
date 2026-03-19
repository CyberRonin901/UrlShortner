package com.cyberronin.url_shortner.controller;

import com.cyberronin.url_shortner.dto.RequestShortUrl;
import com.cyberronin.url_shortner.dto.RequestUrl;
import com.cyberronin.url_shortner.dto.ResponseUrl;
import com.cyberronin.url_shortner.model.ShortUrl;
import com.cyberronin.url_shortner.service.UrlService;
import com.cyberronin.url_shortner.validator.RequestValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin
public class UrlController {

    @Value("${app.base.url}")
    private String BASE_URL;

    private final UrlService urlService;
    private final RequestValidator requestValidator;

    /**
     * Creates controller with required collaborators.
     *
     * @param urlService service implementing URL operations
     * @param requestValidator request input validator
     */
    public UrlController(UrlService urlService, RequestValidator requestValidator) {
        this.urlService = urlService;
        this.requestValidator = requestValidator;
    }

    /**
     * Creates (or reuses) a short URL for the given full URL and optional alias.
     *
     * @param requestUrl payload containing {@code url} and optional {@code alias}
     * @return map containing the generated short URL under key {@code url}
     */
    @PostMapping("/api/v1/shortenUrl")
    public ResponseEntity<Map<String, String>> shortenUrl(@RequestBody RequestUrl requestUrl)
    {
        requestValidator.validateShortenRequestInput(requestUrl);
        String encodede_url = urlService.shortenUrl(requestUrl.url(), requestUrl.alias());

        return ResponseEntity.ok(Map.of("url", encodede_url));
    }

    /**
     * Returns metadata for a previously created short URL (full URL, created/expires timestamps, request count).
     *
     * @param requestShortUrl payload containing encoded {@code url_id} and optional {@code alias}
     * @return full metadata representation for the requested short URL
     */
    @PostMapping({"/api/v1/data"})
    public ResponseEntity<ResponseUrl> getShortUrlData(@RequestBody RequestShortUrl requestShortUrl)
    {
        ShortUrl shortUrlObj = urlService.getShortUrlObjByIdAndAlias(requestShortUrl.url_id(), requestShortUrl.alias());

        String short_url = BASE_URL + "/" + requestShortUrl.url_id();
        if (requestShortUrl.alias() != null && !requestShortUrl.alias().isEmpty())
            short_url += "/" + requestShortUrl.alias();

        ResponseUrl responseUrl = new ResponseUrl(
                short_url,
                shortUrlObj.getUrl(),
                shortUrlObj.getCreatedAt(),
                shortUrlObj.getExpiresAt(),
                shortUrlObj.getRequestCount()
        );

        return ResponseEntity.ok(responseUrl);
    }

    /**
     * Redirects to the full URL represented by the encoded id and optional alias.
     *
     * @param url_id encoded short URL id
     * @param alias optional alias (required when a stored alias exists)
     * @return 307 Temporary Redirect with {@code Location} set to the full URL
     */
    @GetMapping({"/{id}/{alias}", "/{id}"})
    public ResponseEntity<Void> redirectToFullUrl(
            @PathVariable("id") String url_id,
            @PathVariable(required = false) String alias)
    {
        String fullUrl= urlService.getFullUrl(url_id, alias);

        return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
                .header(HttpHeaders.LOCATION, fullUrl)
                .build();
    }

    /**
     * Deletes the short URL entry represented by the encoded id and optional alias.
     *
     * @param url_id encoded short URL id
     * @param alias optional alias (required when a stored alias exists)
     * @return 204 No Content when deletion succeeds
     */
    @DeleteMapping({"/{id}/{alias}", "/{id}"})
    public ResponseEntity<Void> deleteUrl(
            @PathVariable("id") String url_id,
            @PathVariable(required = false) String alias)
    {
        urlService.deleteUrl(url_id, alias);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
