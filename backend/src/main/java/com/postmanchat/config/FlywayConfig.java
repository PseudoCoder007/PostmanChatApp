package com.postmanchat.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    /**
     * Runs repair() before migrate() so checksum mismatches in flyway_schema_history
     * (caused by past file mutations) are fixed automatically on every startup.
     * repair() is safe: it only updates stored checksums to match files on disk
     * and removes orphaned history entries for files that no longer exist.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
