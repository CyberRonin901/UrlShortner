package com.cyberronin.url_shortner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAspectJAutoProxy
@EnableScheduling
public class UrlShortnerApplication {

    /**
     * Application entry point.
     *
     * @param args standard CLI args (unused)
     */
    public static void main(String[] args) {
        SpringApplication.run(UrlShortnerApplication.class, args);
    }

}
