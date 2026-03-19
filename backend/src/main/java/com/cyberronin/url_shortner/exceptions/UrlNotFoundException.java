package com.cyberronin.url_shortner.exceptions;

public class UrlNotFoundException extends RuntimeException{

    private final String requested_url;

    public UrlNotFoundException(String requested_url){
        super(String.format("The request url id [%s] could not be found in the database", requested_url));
        this.requested_url = requested_url;
    }

    public String getRequested_url() {
        return requested_url;
    }
}
