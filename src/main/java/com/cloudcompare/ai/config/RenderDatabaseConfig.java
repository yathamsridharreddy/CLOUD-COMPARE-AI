package com.cloudcompare.ai.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Render's managed Postgres exposes a connection string in the libpq form
 * (postgresql://user:password@host:port/database), which the JDBC driver does
 * NOT accept. Spring Boot / HikariCP need a JDBC URL
 * (jdbc:postgresql://host:port/database) with separate username/password.
 *
 * This bean is created only when the DATABASE_URL env var is present (i.e. on
 * Render); locally it is absent, so Spring Boot falls back to the in-memory H2
 * datasource configured in application.properties.
 */
@Configuration
@ConditionalOnProperty(name = "DATABASE_URL")
public class RenderDatabaseConfig {

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() {
        URI uri = URI.create(databaseUrl);
        String[] userInfo = uri.getUserInfo().split(":", 2);
        String username = userInfo[0];
        String password = userInfo.length > 1 ? userInfo[1] : "";

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        // Sized conservatively to fit Render's free 512 MB web instance.
        dataSource.setMaximumPoolSize(5);
        dataSource.setMinimumIdle(1);
        return dataSource;
    }
}
