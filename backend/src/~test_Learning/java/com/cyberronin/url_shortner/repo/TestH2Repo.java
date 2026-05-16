package com.cyberronin.url_shortner.repo;

import com.cyberronin.url_shortner.model.ShortUrl;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestH2Repo extends JpaRepository<ShortUrl, Integer> {
}
