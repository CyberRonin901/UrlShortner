package com.cyberronin.url_shortner.service;

import com.cyberronin.url_shortner.exceptions.AliasMismatchException;
import com.cyberronin.url_shortner.exceptions.InvalidUrlIdException;
import com.cyberronin.url_shortner.exceptions.UrlExpiredException;
import com.cyberronin.url_shortner.exceptions.UrlNotFoundException;
import com.cyberronin.url_shortner.model.ShortUrl;
import com.cyberronin.url_shortner.repo.UrlRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UrlService {

    private final UrlRepo urlRepo;

    @Value("${app.base.url}")
    private String BASE_URL;

    /**
     * Creates service with required repository dependency.
     *
     * @param urlRepo JPA repository for persisting and querying short URLs
     */
    public UrlService(UrlRepo urlRepo) {
        this.urlRepo = urlRepo;
    }

    /**
     * Ensures the given expiration timestamp has not passed.
     *
     * @param expiryDate expiration timestamp to validate
     * @throws UrlExpiredException if the timestamp is in the past
     */
    private void validateExpiryDate(LocalDateTime expiryDate)
    {
        LocalDateTime curr_Time = LocalDateTime.now();
        if (curr_Time.isAfter(expiryDate))
            throw new UrlExpiredException(expiryDate);
        // url is expired and cannot be used as it may be deleted during process
    }

    /**
     * Encodes an integer database id into a URL-safe, no-padding Base64 string.
     *
     * @param url_id database id
     * @return Base64-url encoded id
     */
    private String encodeId(int url_id)
    {
        String str = Integer.toString(url_id);
        byte[] bytes = str.getBytes();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Creates (or reuses) a {@link ShortUrl} record for the given URL and alias, and returns its full short URL.
     * Expires-at is refreshed to now + 1 month on each call.
     *
     * @param url full URL to shorten
     * @param alias optional alias to append to the short URL
     * @return fully-qualified short URL (base + encoded id [+ alias])
     */
    public String shortenUrl(String url, String alias)
    {
        ShortUrl shortUrlObj = urlRepo.findByUrlAndAlias(url, alias).orElseGet(()->{
            ShortUrl obj = new ShortUrl();
            obj.setUrl(url);
            obj.setAlias(alias);
            obj.setCreatedAt(LocalDateTime.now());
            return obj;
        });

        shortUrlObj.setExpiresAt(LocalDateTime.now().plusMonths(1));
        urlRepo.save(shortUrlObj);

        int url_id = shortUrlObj.getId();
        String encodedString =  BASE_URL + "/" + encodeId(url_id);

        if (alias != null && !alias.isEmpty()){
            encodedString += "/" + alias;
        }

        return encodedString;
    }
    
    /**
     * Loads a {@link ShortUrl} by encoded id, validates alias match rules, and checks expiration.
     *
     * @param url_id encoded id (Base64-url)
     * @param alias optional alias provided by client
     * @return the stored {@link ShortUrl} entity
     * @throws UrlNotFoundException if no record exists for decoded id
     * @throws AliasMismatchException if alias provided does not match stored alias rules
     * @throws UrlExpiredException if the short URL is expired
     */
    public ShortUrl getShortUrlObjByIdAndAlias(String url_id, String alias)
    {
        byte[] bytes = Base64.getDecoder().decode(url_id);
        String decoded_string = new String(bytes, StandardCharsets.UTF_8);
        int id = Integer.parseInt(decoded_string);

        ShortUrl shortUrlObj = urlRepo.findById(id).orElse(null);
        
        if (shortUrlObj == null)
            throw new UrlNotFoundException(url_id);

        if (shortUrlObj.getAlias() == null || shortUrlObj.getAlias().isEmpty()){
           if (!(alias == null || alias.isEmpty()))
               throw new AliasMismatchException(alias, null);
        }
        else if (!shortUrlObj.getAlias().equals(alias))
            throw new AliasMismatchException(alias, shortUrlObj.getAlias());

        validateExpiryDate(shortUrlObj.getExpiresAt());
        
        return shortUrlObj;
    }

    /**
     * Resolves the full URL for the encoded id and alias, increments request count, refreshes expiry, and persists.
     *
     * @param url_id encoded id (Base64-url)
     * @param alias optional alias provided by client
     * @return resolved full URL
     */
    public String getFullUrl(String url_id, String alias)
    {
        ShortUrl shortUrlObj = getShortUrlObjByIdAndAlias(url_id, alias);
        
        shortUrlObj.setRequestCount(shortUrlObj.getRequestCount() + 1);
        shortUrlObj.setExpiresAt(LocalDateTime.now().plusMonths(1));
        urlRepo.save(shortUrlObj);

        return shortUrlObj.getUrl();
    }

    /**
     * Deletes the short URL record represented by the encoded id and optional alias.
     *
     * @param url_id encoded id (Base64-url)
     * @param alias optional alias provided by client
     */
    public void deleteUrl(String url_id, String alias)
    {
        ShortUrl shortUrlObj = getShortUrlObjByIdAndAlias(url_id, alias);
        urlRepo.delete(shortUrlObj);
    }

    /**
     * Returns the stored request count for the short URL represented by the encoded id and optional alias.
     *
     * @param url_id encoded id (Base64-url)
     * @param alias optional alias provided by client
     * @return current request count persisted in the database
     */
    public int getRequestCount(String url_id, String alias)
    {
        ShortUrl shortUrlObj = getShortUrlObjByIdAndAlias(url_id, alias);
        return shortUrlObj.getRequestCount();
    }
}
