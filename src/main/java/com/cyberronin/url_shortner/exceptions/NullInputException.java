package com.cyberronin.url_shortner.exceptions;

public class NullInputException extends RuntimeException{

    public NullInputException(){
        super("Input is null or blank");
    }
}
