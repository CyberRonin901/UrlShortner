package com.cyberronin.url_shortner.validator;

import com.cyberronin.url_shortner.dto.RequestUrl;
import com.cyberronin.url_shortner.exceptions.InvalidInputLengthException;
import com.cyberronin.url_shortner.exceptions.NullInputException;
import com.cyberronin.url_shortner.exceptions.ProhibitedDomainException;
import com.cyberronin.url_shortner.validator.RequestValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
public class RequestValidatorTest {

    @InjectMocks
    private RequestValidator requestValidator;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(requestValidator, "MAX_ALIAS_SIZE", 20);
        ReflectionTestUtils.setField(requestValidator, "MIN_ALIAS_SIZE", 3);
        ReflectionTestUtils.setField(requestValidator, "BASE_URL", "http://localhost:8080");
    }

    @Nested
    class ValidateShortenRequestInputTests {

        @Test
        void validateShortenRequestInput_WhenUrlIsNull_ShouldThrowNullInputException() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl(null, "alias");

            // WHEN / THEN: expect this result
            assertThrows(NullInputException.class, () -> requestValidator.validateShortenRequestInput(request));
        }

        @Test
        void validateShortenRequestInput_WhenUrlIsEmpty_ShouldThrowNullInputException() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("", "alias");

            // WHEN / THEN: expect this result
            assertThrows(NullInputException.class, () -> requestValidator.validateShortenRequestInput(request));
        }

        @Test
        void validateShortenRequestInput_WhenUrlContainsBaseUrl_ShouldThrowProhibitedDomainException() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("http://localhost:8080/somepath", "alias");

            // WHEN / THEN: expect this result
            assertThrows(ProhibitedDomainException.class, () -> requestValidator.validateShortenRequestInput(request));
        }

        @Test
        void validateShortenRequestInput_WhenAliasIsTooShort_ShouldThrowInvalidInputLengthException() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("https://google.com", "go");

            // WHEN / THEN: expect this result
            assertThrows(InvalidInputLengthException.class, () -> requestValidator.validateShortenRequestInput(request));
        }

        @Test
        void validateShortenRequestInput_WhenAliasIsTooLong_ShouldThrowInvalidInputLengthException() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("https://google.com", "thisaliasIsDefinitelyTooLongToBeValidForThisTest");

            // WHEN / THEN: expect this result
            assertThrows(InvalidInputLengthException.class, () -> requestValidator.validateShortenRequestInput(request));
        }

        @Test
        void validateShortenRequestInput_WhenValid_ShouldReturnTrue() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("https://google.com", "google");

            // WHEN: executing the logic
            boolean result = requestValidator.validateShortenRequestInput(request);

            // THEN: expect this result
            assertTrue(result);
        }

        @Test
        void validateShortenRequestInput_WhenAliasIsNull_ShouldReturnTrue() {
            // GIVEN: some input is given
            RequestUrl request = new RequestUrl("https://google.com", null);

            // WHEN: executing the logic
            boolean result = requestValidator.validateShortenRequestInput(request);

            // THEN: expect this result
            assertTrue(result);
        }
    }
}
