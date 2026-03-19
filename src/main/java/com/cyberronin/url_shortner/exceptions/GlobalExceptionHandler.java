package com.cyberronin.url_shortner.exceptions;

import com.cyberronin.url_shortner.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 Not Found
    @ExceptionHandler(UrlNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UrlNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // 400 Bad Request
    @ExceptionHandler({
            AliasMismatchException.class,
            InvalidInputLengthException.class,
            InvalidUrlIdException.class,
            ProhibitedDomainException.class,
            NullInputException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(RuntimeException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // 410 Gone
    @ExceptionHandler(UrlExpiredException.class)
    public ResponseEntity<ErrorResponse> handleExpired(UrlExpiredException ex) {
        return buildResponse(HttpStatus.GONE, ex.getMessage());
    }

//     Fallback for all other exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        System.out.println(ex.toString());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Internal Server Error");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
        ErrorResponse error = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message
        );
        return new ResponseEntity<>(error, status);
    }
}