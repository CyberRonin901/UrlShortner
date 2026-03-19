package com.cyberronin.url_shortner.controller;

import com.cyberronin.url_shortner.service.StatsService;
import com.cyberronin.url_shortner.service.UrlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
@CrossOrigin
public class StatsController {
    private final UrlService urlService;
    private final StatsService statsService;

    /**
     * Creates controller with required collaborators.
     *
     * @param statsService in-memory counters service
     * @param urlService URL lookup service (used for per-URL request count)
     */
    public StatsController(StatsService statsService, UrlService urlService)
    {
        this.statsService = statsService;
        this.urlService = urlService;
    }

    /**
     * Returns the total number of requests received by {@code UrlController} endpoints.
     *
     * @return map with key {@code totalRequestCount}
     */
    @GetMapping("/totalRequestCount")
    public ResponseEntity<Map<String, Long>> totalRequestCount()
    {
        return ResponseEntity.ok(Map.of("totalRequestCount", statsService.getTotalRequestCount()));
    }

    /**
     * Returns the stored request/redirect count for a specific short URL.
     *
     * @param url_id encoded short URL id
     * @param alias optional alias (required when a stored alias exists)
     * @return map with key {@code requestCount}
     */
    @GetMapping("/requestCount")
    public ResponseEntity<Map<String, Integer>> requestCount(
            @RequestParam String url_id,
            @RequestParam(required = false) String alias)
    {
        int reqCount = urlService.getRequestCount(url_id, alias);
        return ResponseEntity.ok(Map.of("requestCount", reqCount));
    }

    /**
     * Returns the total number of redirects performed by the redirect endpoint.
     *
     * @return map with key {@code redirectCount}
     */
    @GetMapping("/redirectCount")
    public ResponseEntity<Map<String, Long>> redirectCount()
    {
        return ResponseEntity.ok(Map.of("redirectCount", statsService.getRedirectCount()));
    }
}
