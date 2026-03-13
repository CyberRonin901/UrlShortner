package com.cyberronin.url_shortner.service;

import lombok.Getter;
import org.springframework.stereotype.Service;

@Service
@Getter
public class StatsService {

    private long totalRequestCount;
    private long redirectCount;

    public StatsService() {
        this.totalRequestCount = 0;
        this.redirectCount = 0;
    }

    public long incrementTotalRequestCount(){
        totalRequestCount++;
        return totalRequestCount;
    }

    public long incrementRedirectCount(){
        redirectCount++;
        return redirectCount;
    }
}
