package com.cyberronin.url_shortner.controller;

import com.cyberronin.url_shortner.controller.WildCardControlller;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
public class WildCardControlllerTest {

    @InjectMocks
    private WildCardControlller wildCardControlller;

    @Nested
    class CatchAllTests {

        @Test
        void catchAll_ShouldReturnBadRequest() {
            // GIVEN: some input is given (none required for this method)

            // WHEN: executing the logic
            ResponseEntity<String> response = wildCardControlller.catchAll();

            // THEN: expect this result
            assertNotNull(response);
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Path not found", response.getBody());
        }
    }
}
