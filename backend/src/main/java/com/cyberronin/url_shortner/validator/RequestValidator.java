package com.cyberronin.url_shortner.validator;

import com.cyberronin.url_shortner.dto.RequestUrl;
import com.cyberronin.url_shortner.exceptions.InvalidInputLengthException;
import com.cyberronin.url_shortner.exceptions.NullInputException;
import com.cyberronin.url_shortner.exceptions.ProhibitedDomainException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RequestValidator {

    @Value("${app.url.alias.max.size}")
    private int MAX_ALIAS_SIZE;

    @Value("${app.url.alias.min.size}")
    private int MIN_ALIAS_SIZE;

    @Value("${app.base.url}")
    private String BASE_URL;

    public boolean validateShortenRequestInput(RequestUrl requestUrl)
    {
        if (requestUrl.url() == null || requestUrl.url().isEmpty())
            throw new NullInputException(); // Input is null

        if (requestUrl.url().startsWith(BASE_URL))
            throw new ProhibitedDomainException(); // Input cannot contain the domain of the API

        if (requestUrl.alias() != null){
            int aliasLength = requestUrl.alias().length();

            if (aliasLength > MAX_ALIAS_SIZE || aliasLength < MIN_ALIAS_SIZE)
                throw new InvalidInputLengthException(requestUrl.alias().length(), MAX_ALIAS_SIZE, MIN_ALIAS_SIZE); // input too large

        }

        return true;
    }
}
