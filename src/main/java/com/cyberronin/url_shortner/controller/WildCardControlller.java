package com.cyberronin.url_shortner.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WildCardControlller {
    @RequestMapping("/**")
    public ResponseEntity<String> catchAll(){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Path not found");
    }
}
