package com.cyberronin.url_shortner.dto;

import jakarta.annotation.Nullable;

public record RequestUrl (String url, @Nullable String alias){}
