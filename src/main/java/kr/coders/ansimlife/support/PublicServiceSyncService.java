package kr.coders.ansimlife.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PublicServiceSyncService {

    private static final Logger log = LoggerFactory.getLogger(PublicServiceSyncService.class);
    private static final String LIST_URL = "https://api.odcloud.kr/api/gov24/v3/serviceList";
    private static final int PAGE_SIZE = 1_000;
    private static final int MAX_PAGES = 30;
    private static final Map<String, String> REGIONS = new LinkedHashMap<>();

    static {
        REGIONS.put("서울", "서울");
        REGIONS.put("부산", "부산");
        REGIONS.put("대구", "대구");
        REGIONS.put("인천", "인천");
        REGIONS.put("광주", "광주");
        REGIONS.put("대전", "대전");
        REGIONS.put("울산", "울산");
        REGIONS.put("세종", "세종");
        REGIONS.put("경기", "경기");
        REGIONS.put("강원", "강원");
        REGIONS.put("충북", "충북");
        REGIONS.put("충청북", "충북");
        REGIONS.put("충남", "충남");
        REGIONS.put("충청남", "충남");
        REGIONS.put("전북", "전북");
        REGIONS.put("전라북", "전북");
        REGIONS.put("전남", "전남");
        REGIONS.put("전라남", "전남");
        REGIONS.put("경북", "경북");
        REGIONS.put("경상북", "경북");
        REGIONS.put("경남", "경남");
        REGIONS.put("경상남", "경남");
        REGIONS.put("제주", "제주");
    }

    private final SupportProgramRepository repository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String serviceKey;

    private volatile String status;
    private volatile int totalAvailable;
    private volatile Instant lastSyncedAt;

    public PublicServiceSyncService(SupportProgramRepository repository,
                                    ObjectMapper objectMapper,
                                    @Value("${ansimlife.public-data.service-key:}") String serviceKey) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.serviceKey = decodeIfNeeded(serviceKey.trim());
        this.status = this.serviceKey.isBlank() ? "DISABLED" : "WAITING";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncAfterStartup() {
        Thread.ofVirtual().name("public-benefit-sync").start(this::syncNow);
    }

    @Scheduled(cron = "0 20 4 * * *", zone = "Asia/Seoul")
    public synchronized void syncNow() {
        if (serviceKey.isBlank()) {
            status = "DISABLED";
            log.info("Public service synchronization is disabled because no service key is configured");
            return;
        }

        status = "SYNCING";
        int saved = 0;
        boolean complete = false;
        try {
            Map<String, SupportProgram> existing = new LinkedHashMap<>();
            repository.findAll().forEach(program -> {
                if (program.getExternalId() != null && !program.getExternalId().isBlank()) {
                    existing.put(program.getExternalId(), program);
                }
            });

            for (int page = 1; page <= MAX_PAGES; page++) {
                PagePayload payload = fetch(page);
                totalAvailable = payload.totalCount();
                if (payload.items().isEmpty()) {
                    complete = totalAvailable == 0 || saved >= totalAvailable;
                    break;
                }

                List<SupportProgram> batch = new ArrayList<>(payload.items().size());
                for (JsonNode item : payload.items()) {
                    String externalId = text(item, "서비스ID");
                    if (externalId.isBlank()) continue;
                    SupportProgram mapped = map(externalId, item);
                    if (mapped == null) continue;
                    SupportProgram program = existing.get(externalId);
                    if (program == null) {
                        program = mapped;
                        existing.put(externalId, program);
                    } else {
                        program.sync(mapped.getTitle(), mapped.getRegion(), mapped.getCategory(), mapped.getTarget(),
                                mapped.getSummary(), mapped.getBenefit(), mapped.getApplyUrl(),
                                mapped.getDeadline(), mapped.isUrgent());
                    }
                    batch.add(program);
                }
                repository.saveAllAndFlush(batch);
                saved += batch.size();
                log.info("Public support sync progress: page {}, {} of {} records", page, saved, totalAvailable);

                if (totalAvailable > 0 && page * PAGE_SIZE >= totalAvailable) {
                    complete = true;
                    break;
                }
                if (payload.items().size() < PAGE_SIZE) {
                    complete = totalAvailable == 0 || saved >= totalAvailable;
                    break;
                }
            }
            lastSyncedAt = Instant.now();
            status = complete ? "READY" : "PARTIAL";
            log.info("Synchronized {} public support programs; API total is {}", saved, totalAvailable);
        } catch (Exception error) {
            status = saved > 0 ? "PARTIAL" : "ERROR";
            log.warn("Public service synchronization stopped after {} records: {}", saved, error.getMessage());
        }
    }

    private PagePayload fetch(int page) throws Exception {
        URI uri = URI.create(LIST_URL + "?page=" + page + "&perPage=" + PAGE_SIZE + "&returnType=JSON");
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(35))
                .header("Accept", "application/json")
                .header("Authorization", "Infuser " + serviceKey)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("Public data API returned status " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode data = root.path("data");
        List<JsonNode> items = data.isArray()
                ? objectMapper.convertValue(data,
                objectMapper.getTypeFactory().constructCollectionType(List.class, JsonNode.class))
                : List.of();
        return new PagePayload(root.path("totalCount").asInt(0), items);
    }

    private SupportProgram map(String externalId, JsonNode item) {
        String title = clean(text(item, "서비스명"), 200);
        if (title.isBlank()) return null;
        String field = text(item, "서비스분야");
        String agency = text(item, "소관기관명");
        String agencyType = text(item, "소관기관유형");
        String target = clean(first(text(item, "지원대상"), text(item, "사용자구분"), "대상 조건 확인 필요"), 220);
        String summary = clean(first(text(item, "서비스목적요약"), text(item, "선정기준"), title + " 지원 정보를 확인해보세요."), 300);
        String benefit = clean(first(text(item, "지원내용"), text(item, "신청방법"), "지원 내용 확인"), 300);
        String deadline = clean(first(text(item, "신청기한"), "기관 공고 확인"), 180);
        String applyUrl = clean(text(item, "상세조회URL"), 500);
        String category = category(field, title);
        String region = region(agency, agencyType);
        String urgencyText = (title + " " + deadline).toLowerCase(Locale.ROOT);
        boolean urgent = urgencyText.contains("1인") || urgencyText.contains("청년")
                || urgencyText.contains("월세") || urgencyText.contains("긴급") || urgencyText.contains("안심");
        return new SupportProgram(externalId, title, region, category, target, summary,
                benefit, applyUrl, deadline, urgent);
    }

    private String category(String field, String title) {
        if (!field.isBlank()) return clean(field, 30);
        String value = title.replace(" ", "");
        if (value.contains("임신") || value.contains("출산")) return "임신·출산";
        if (value.contains("돌봄") || value.contains("보호")) return "보호·돌봄";
        if (value.contains("주거") || value.contains("자립") || value.contains("월세")) return "주거·자립";
        if (value.contains("취업") || value.contains("창업") || value.contains("고용")) return "고용·창업";
        if (value.contains("교육") || value.contains("보육")) return "보육·교육";
        if (value.contains("건강") || value.contains("의료")) return "보건·의료";
        if (value.contains("문화") || value.contains("환경")) return "문화·환경";
        if (value.contains("농업") || value.contains("어업") || value.contains("축산")) return "농림축산어업";
        if (value.contains("안전") || value.contains("재난") || value.contains("행정")) return "행정·안전";
        return "생활안정";
    }

    private String region(String agency, String agencyType) {
        for (Map.Entry<String, String> entry : REGIONS.entrySet()) {
            if (agency.contains(entry.getKey())) return entry.getValue();
        }
        if (agencyType.contains("중앙") || agencyType.contains("공공기관")) return "전국";
        return "전국";
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }

    private String first(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return "";
    }

    private String clean(String value, int maxLength) {
        String cleaned = value.replace("||", " · ").replaceAll("\\s+", " ").trim();
        if (cleaned.length() <= maxLength) return cleaned;
        return cleaned.substring(0, maxLength - 1).trim() + "…";
    }

    private String decodeIfNeeded(String value) {
        if (!value.contains("%")) return value;
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    public String getStatus() {
        return status;
    }

    public int getTotalAvailable() {
        return totalAvailable;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    private record PagePayload(int totalCount, List<JsonNode> items) {}
}
