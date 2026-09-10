package com.cloudcompare.ai.controller;

import com.cloudcompare.ai.dto.ChatResponse;
import com.cloudcompare.ai.repository.UserRepository;
import com.cloudcompare.ai.security.CustomUserDetailsService;
import com.cloudcompare.ai.security.JwtUtil;
import com.cloudcompare.ai.service.chat.CloudCompareChatbotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Exercises the real security chain, JWT filter, rate limiter, and MVC CORS rules. */
@SpringBootTest(properties = {
        "cors.allowed-origins=https://cloud-compareai.vercel.app",
        "grok.api.keys=",
        "logging.level.org.springframework.web=INFO"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    private static final String FRONTEND = "https://cloud-compareai.vercel.app";
    private static final AtomicInteger NEXT_IP = new AtomicInteger();

    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private JwtUtil jwtUtil;
    @MockBean
    private CustomUserDetailsService userDetailsService;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private CloudCompareChatbotService cloudCompareChatbotService;

    private String clientIp;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        // Rate-limit state belongs to the application, so isolate each test's quota.
        clientIp = "192.0.2." + NEXT_IP.incrementAndGet();
    }

    private MockHttpServletRequestBuilder fromClient(MockHttpServletRequestBuilder request) {
        return request.header("X-Forwarded-For", clientIp);
    }

    @Test
    void privacyNoticeIsPublicWithoutAUserLookup() throws Exception {
        mockMvc.perform(fromClient(get("/privacy-policy.html")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("Privacy Policy")));
        verifyNoInteractions(jwtUtil, userDetailsService, userRepository);
    }

    @Test
    void healthIsPublicAndLightweight() throws Exception {
        mockMvc.perform(fromClient(get("/health")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("OK"));
        verifyNoInteractions(jwtUtil, userDetailsService, userRepository);
    }

    @Test
    void healthBypassesJwtAndDatabaseEvenWithAuthorizationHeader() throws Exception {
        when(jwtUtil.extractUsername("database-unavailable")).thenReturn("test@example.com");
        when(userDetailsService.loadUserByUsername("test@example.com"))
                .thenThrow(new IllegalStateException("Database must not be consulted by liveness"));

        mockMvc.perform(fromClient(get("/health").queryParam("probe", "render"))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer database-unavailable"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
        verifyNoInteractions(jwtUtil, userDetailsService, userRepository);
    }

    @Test
    void oldProbeReproduces429ButNewHealthSurvivesAnExhaustedApiQuota() throws Exception {
        // Reproduces the original Render failure without sending traffic to production.
        for (int i = 0; i < 50; i++) {
            mockMvc.perform(fromClient(get("/api/test")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
        mockMvc.perform(fromClient(get("/api/test")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error", containsString("Too many requests")));

        for (int i = 0; i < 100; i++) {
            mockMvc.perform(fromClient(get("/health")))
                    .andExpect(status().isOk())
                    .andExpect(content().string("OK"));
        }
        // Health must not reset or weaken the API's original quota either.
        mockMvc.perform(fromClient(get("/api/test")))
                .andExpect(status().isTooManyRequests());
        verifyNoInteractions(jwtUtil, userDetailsService, userRepository);
    }

    @Test
    void frequentHealthProbesDoNotConsumeTheApiQuota() throws Exception {
        for (int i = 0; i < 100; i++) {
            mockMvc.perform(fromClient(get("/health")))
                    .andExpect(status().isOk());
        }
        for (int i = 0; i < 50; i++) {
            mockMvc.perform(fromClient(get("/api/test")))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(fromClient(get("/api/test")))
                .andExpect(status().isTooManyRequests());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/compare", "/api/ai-compare", "/api/nlp-compare", "/api/chat/cloud", "/api/chat/ai-tools"})
    void businessApisStillRequireAuthentication(String path) throws Exception {
        mockMvc.perform(fromClient(post(path)).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @CsvSource({"POST,/health", "GET,/health/private", "GET,/healthcheck", "GET,/api/health"})
    void publicHealthRuleDoesNotExposeOtherMethodsOrPaths(String method, String path) throws Exception {
        mockMvc.perform(fromClient(request(HttpMethod.valueOf(method), path)))
                .andExpect(status().isForbidden());
    }

    @Test
    void existingLegacyApiResponseIsUnchanged() throws Exception {
        mockMvc.perform(fromClient(get("/api/test")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ok"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void allowedFrontendCanStillReachLoginAndPreflight() throws Exception {
        mockMvc.perform(fromClient(options("/api/auth/login"))
                        .header(HttpHeaders.ORIGIN, FRONTEND)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND));
        mockMvc.perform(fromClient(post("/api/auth/login"))
                        .header(HttpHeaders.ORIGIN, FRONTEND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\",\"password\":\"invalid\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND));
    }

    @Test
    void unapprovedOriginIsStillRejectedOnApiRoutes() throws Exception {
        mockMvc.perform(fromClient(post("/api/auth/login"))
                        .header(HttpHeaders.ORIGIN, "https://untrusted.example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\",\"password\":\"invalid\"}"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void apiCorsSettingsCannotBlockTheHealthProbe() throws Exception {
        mockMvc.perform(fromClient(get("/health"))
                        .header(HttpHeaders.ORIGIN, "https://untrusted.example"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void validJwtStillAuthenticatesProtectedApiCalls() throws Exception {
        UserDetails user = User.withUsername("test@example.com")
                .password("unused").authorities("USER").build();
        when(jwtUtil.extractUsername("valid-token")).thenReturn(user.getUsername());
        when(userDetailsService.loadUserByUsername(user.getUsername())).thenReturn(user);
        when(jwtUtil.validateToken("valid-token", user)).thenReturn(true);
        when(cloudCompareChatbotService.chat(any())).thenReturn(
                ChatResponse.builder().reply("Existing authenticated API still works").build());

        mockMvc.perform(fromClient(post("/api/chat/cloud"))
                        .header(HttpHeaders.ORIGIN, FRONTEND)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"Explain the recommendation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reply").value("Existing authenticated API still works"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND));
        verify(jwtUtil).validateToken("valid-token", user);
        verify(userDetailsService).loadUserByUsername(user.getUsername());
    }
}
