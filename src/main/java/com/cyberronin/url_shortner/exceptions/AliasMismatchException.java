package com.cyberronin.url_shortner.exceptions;

public class AliasMismatchException extends RuntimeException{

    private final String inputAlias;
    private final String storedAlias;

    public AliasMismatchException(String inputAlias, String storedAlias){
        super(String.format(
                "The alias provided [%s] does not match the alias stored in the database [%s]", inputAlias, storedAlias
        ));
        this.inputAlias = inputAlias;
        this.storedAlias = storedAlias;
    }

    public String getInputAlias() {
        return inputAlias;
    }

    public String getStoredAlias() {
        return storedAlias;
    }
}
