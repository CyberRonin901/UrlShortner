package com.cyberronin.url_shortner;

import com.cyberronin.url_shortner.dto.RequestUrl;
import com.cyberronin.url_shortner.repo.TestH2Repo;
import com.cyberronin.url_shortner.repo.UrlRepo;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/*
(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
this will use any random port number for testing the application

*/

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UrlShortnerApplicationTests {

    @LocalServerPort
    private int PORT;
    // This gives the random port on which the app is running

    private String BASE_URL = "http://localhost";

    private static RestTemplate restTemplate;

//    @Autowired
//    private TestH2Repo h2Repo;

    @Autowired
    private UrlRepo urlRepo;

    @BeforeAll
    public static void init(){
        restTemplate = new RestTemplate();
    }

    @BeforeEach
    public void setUp(){
        BASE_URL = "http://localhost:" + PORT;
    }

    @Test
    public void testShortenUrl(){
        RequestUrl requestUrl = new RequestUrl("https://youtube.com", "youtube");
        String endpoint = BASE_URL + "/api/v1/shortenUrl";

        ResponseEntity<Map<String, String>> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                new HttpEntity<>(requestUrl),
                new ParameterizedTypeReference<Map<String, String>>() {}
        );

        assertNotNull(response, "Response should not be null");
        assertNotNull(response.getBody(), "Response body should not be null");
    }
}