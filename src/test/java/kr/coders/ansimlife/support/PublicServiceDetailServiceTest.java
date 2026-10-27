package kr.coders.ansimlife.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PublicServiceDetailServiceTest {
    private static final Instant START = Instant.parse("2026-10-27T06:00:00Z");

    @Test
    void reportsCacheTimeAndRefreshCooldownThenLoadsChangedOfficialDeadline() {
        HttpClient client = mock(HttpClient.class);
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> deadline = new AtomicReference<>("2026.10.31");
        when(client.sendAsync(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenAnswer(invocation -> {
                    calls.incrementAndGet();
                    HttpRequest request = invocation.getArgument(0);
                    assertThat(request.headers().firstValue("Authorization")).contains("Infuser test-service-key");
                    return CompletableFuture.completedFuture(response(200, body(deadline.get())));
                });
        MutableClock clock = new MutableClock();
        var service = new PublicServiceDetailService(new ObjectMapper(), "test-service-key", client, clock);
        var first = service.lookup(program(), false);
        assertThat(first.detail().sourceLive()).isTrue();
        assertThat(first.sourceFetchedAt()).isEqualTo(START);
        assertThat(first.sourceCached()).isFalse();
        assertThat(service.lookup(program(), false).sourceCached()).isTrue();
        assertThat(service.lookup(program(), true).refreshLimited()).isTrue();
        assertThat(calls.get()).isEqualTo(2);

        clock.advance(Duration.ofSeconds(61));
        deadline.set("2026.11.30");
        var refreshed = service.lookup(program(), true);
        assertThat(refreshed.detail().deadline()).isEqualTo("2026.11.30");
        assertThat(refreshed.sourceFetchedAt()).isEqualTo(START.plusSeconds(61));
        assertThat(refreshed.sourceCached()).isFalse();
        assertThat(calls.get()).isEqualTo(4);

        clock.advance(Duration.ofMinutes(11));
        assertThat(service.lookup(program(), false).sourceCached()).isFalse();
        assertThat(calls.get()).isEqualTo(6);
    }

    @Test
    void failedRefreshPreservesPreviousOfficialInformationAndItsTime() {
        HttpClient client = mock(HttpClient.class);
        AtomicInteger status = new AtomicInteger(200);
        when(client.sendAsync(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenAnswer(invocation -> CompletableFuture.completedFuture(response(status.get(), body("2026.10.31"))));
        MutableClock clock = new MutableClock();
        var service = new PublicServiceDetailService(new ObjectMapper(), "test-service-key", client, clock);
        service.lookup(program(), false);
        clock.advance(Duration.ofMinutes(2));
        status.set(401);
        var result = service.lookup(program(), true);
        assertThat(result.refreshFailed()).isTrue();
        assertThat(result.sourceCached()).isTrue();
        assertThat(result.sourceFetchedAt()).isEqualTo(START);
        assertThat(result.detail().deadline()).isEqualTo("2026.10.31");
    }

    @Test
    void missingCredentialAndEmptyOfficialResponseNeverClaimLiveData() {
        HttpClient client = mock(HttpClient.class);
        var disabled = new PublicServiceDetailService(new ObjectMapper(), "", client, new MutableClock());
        var fallback = disabled.lookup(program(), true);
        assertThat(fallback.detail().sourceLive()).isFalse();
        assertThat(fallback.refreshAvailable()).isFalse();
        verifyNoInteractions(client);

        when(client.sendAsync(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenAnswer(invocation -> CompletableFuture.completedFuture(response(200, "{\"data\":[]}")));
        var enabled = new PublicServiceDetailService(new ObjectMapper(), "test-service-key", client, new MutableClock());
        var empty = enabled.lookup(program(), false);
        assertThat(empty.detail().sourceLive()).isFalse();
        assertThat(empty.refreshFailed()).isTrue();
        assertThat(empty.sourceFetchedAt()).isNull();
    }

    @Test
    void concurrentRequestsShareTheSameTwoOfficialCalls() throws Exception {
        HttpClient client = mock(HttpClient.class);
        CompletableFuture<HttpResponse<String>> listing = new CompletableFuture<>();
        CompletableFuture<HttpResponse<String>> detail = new CompletableFuture<>();
        CountDownLatch requested = new CountDownLatch(2);
        AtomicInteger calls = new AtomicInteger();
        when(client.sendAsync(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenAnswer(invocation -> {
                    calls.incrementAndGet(); requested.countDown();
                    HttpRequest request = invocation.getArgument(0);
                    return request.uri().getPath().endsWith("serviceList") ? listing : detail;
                });
        var service = new PublicServiceDetailService(new ObjectMapper(), "test-service-key", client, new MutableClock());
        AtomicReference<PublicServiceDetailService.DetailLookup> first = new AtomicReference<>();
        AtomicReference<PublicServiceDetailService.DetailLookup> second = new AtomicReference<>();
        Thread one = Thread.ofVirtual().start(() -> first.set(service.lookup(program(), false)));
        assertThat(requested.await(2, TimeUnit.SECONDS)).isTrue();
        Thread two = Thread.ofVirtual().start(() -> second.set(service.lookup(program(), false)));
        try {
            long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
            while (two.getState() != Thread.State.WAITING && System.nanoTime() < until) Thread.sleep(2);
            assertThat(two.getState()).isEqualTo(Thread.State.WAITING);
        } finally {
            listing.complete(response(200, body("2026.10.31")));
            detail.complete(response(200, body("2026.10.31")));
            one.join(2_000); two.join(2_000);
        }
        assertThat(calls.get()).isEqualTo(2);
        assertThat(first.get().detail().sourceLive()).isTrue();
        assertThat(second.get().sourceFetchedAt()).isEqualTo(first.get().sourceFetchedAt());
    }

    private static SupportProgram program() {
        return new SupportProgram("TEST-ID", "공식 혜택", "전국", "생활안정", "저장 대상", "안내", "저장 내용", "https://gov.example", "저장 기간", false);
    }

    private static String body(String deadline) {
        return "{\"data\":[{\"서비스ID\":\"TEST-ID\",\"지원대상\":\"공식 대상\",\"지원내용\":\"공식 지원 내용\",\"신청기한\":\"" + deadline + "\"}]}";
    }

    @SuppressWarnings("unchecked")
    private static HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }

    private static final class MutableClock extends Clock {
        private Instant now = START;
        void advance(Duration duration) { now = now.plus(duration); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
