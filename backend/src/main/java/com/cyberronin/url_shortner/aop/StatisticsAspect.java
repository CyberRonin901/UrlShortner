package com.cyberronin.url_shortner.aop;

import com.cyberronin.url_shortner.service.StatsService;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class StatisticsAspect {

    private StatsService service;

    public StatisticsAspect(StatsService service) {
        this.service = service;
    }

    @Before("execution(* com.cyberronin.url_shortner.controller.UrlController.*(..))")
    public void incrementResquestCount(){
        service.incrementTotalRequestCount();
    }

    @AfterReturning("execution(* com.cyberronin.url_shortner.controller.UrlController.redirectToFullUrl(..))")
    public void incrementRedirectCount(){
        service.incrementRedirectCount();
    }
}
