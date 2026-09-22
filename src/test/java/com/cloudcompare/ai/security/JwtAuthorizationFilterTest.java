package com.cloudcompare.ai.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class JwtAuthorizationFilterTest {

    private JwtUtil jwtUtil;
    private CustomUserDetailsService userDetailsService;
    private JwtAuthorizationFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtUtil = mock(JwtUtil.class);
        userDetailsService = mock(CustomUserDetailsService.class);
        filter = new JwtAuthorizationFilter(jwtUtil, userDetailsService);
        chain = mock(FilterChain.class);
    }

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Bearer malformed", "Bearer expired", "Bearer otherwise-valid", "Basic unused"})
    void healthNeverParsesCredentialsOrLooksUpUsers(String authorization) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        request.addHeader("Authorization", authorization);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/auth/forgot-password", "/api/auth/reset-password"})
    void recoveryRequestsDoNotDependOnAnOldLoginToken(String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.addHeader("Authorization", "Bearer malformed");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService);
    }

    @Test
    void healthBypassAlsoWorksWithAContextPathAndQueryString() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/application/health");
        request.setContextPath("/application");
        request.setServletPath("/health");
        request.setQueryString("probe=render");
        request.addHeader("Authorization", "Bearer unused");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService);
    }

    @ParameterizedTest
    @CsvSource({
            "POST,/health",
            "GET,/health/private",
            "GET,/healthcheck",
            "GET,/api/test",
            "POST,/api/compare",
            "POST,/api/chat/cloud"
    })
    void otherRequestsStillProcessAndValidateJwt(String method, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        UserDetails user = User.withUsername("test@example.com")
                .password("unused").authorities("USER").build();
        when(jwtUtil.extractUsername("valid-token")).thenReturn(user.getUsername());
        when(userDetailsService.loadUserByUsername(user.getUsername())).thenReturn(user);
        when(jwtUtil.validateToken("valid-token", user)).thenReturn(true);

        filter.doFilter(request, response, chain);

        verify(jwtUtil).extractUsername("valid-token");
        verify(userDetailsService).loadUserByUsername(user.getUsername());
        verify(jwtUtil).validateToken("valid-token", user);
        verify(chain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
