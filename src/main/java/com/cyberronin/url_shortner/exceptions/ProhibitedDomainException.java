package com.cyberronin.url_shortner.exceptions;

public class ProhibitedDomainException extends RuntimeException{

    public ProhibitedDomainException(){
        super("Input url contains the base url of the API");
    }
}
