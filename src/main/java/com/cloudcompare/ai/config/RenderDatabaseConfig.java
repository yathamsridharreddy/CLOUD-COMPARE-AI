package com.cloudcompare.ai.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Managed Postgres (Render / Railway) exposes a connection string in the libpq
 * form (postgresql://user:password@host:port/database), which the JDBC driver
 * does NOT accept. Spring Boot / HikariCP need a JDBC URL
 * (jdbc:postgresql://host:port/database) with separate username/password.
 *
 * This bean is created only when the DATABASE_URL env var is present (set on
 * Render via render.yaml and on Railway as a reference to the Postgres
 * service); locally it is absent, so Spring Boot falls back to the in-memory H2
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

        // Railway (and managed Postgres generally) requires TLS for connections.
        // Append sslmode=require unless the URL already carries query params.
        if (!jdbcUrl.contains("?")) {
            jdbcUrl += "?sslmode=require";
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        // Sized to fit the free/small plan while keeping persistence stable.
        dataSource.setMaximumPoolSize(5);
        dataSource.setMinimumIdle(1);
        return dataSource;
    }
}
