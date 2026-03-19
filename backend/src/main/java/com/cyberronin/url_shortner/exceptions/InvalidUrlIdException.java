package com.cyberronin.url_shortner.exceptions;

public class InvalidUrlIdException extends RuntimeException{

    public InvalidUrlIdException(String message){
        super(message);
    }
}
