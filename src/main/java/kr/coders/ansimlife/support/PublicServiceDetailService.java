package kr.coders.ansimlife.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PublicServiceDetailService {

    private static final Logger log = LoggerFactory.getLogger(PublicServiceDetailService.class);
    private static final String LIST_URL = "https://api.odcloud.kr/api/gov24/v3/serviceList";
    private static final String DETAIL_URL = "https://api.odcloud.kr/api/gov24/v3/serviceDetail";
    private static final Duration CACHE_TTL = Duration.ofHours(6);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String serviceKey;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public PublicServiceDetailService(ObjectMapper objectMapper,
                                      @Value("${ansimlife.public-data.service-key:}") String serviceKey) {
        this.objectMapper = objectMapper;
        this.serviceKey = decodeIfNeeded(serviceKey.trim());
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public ProgramDetail find(SupportProgram program) {
        String externalId = program.getExternalId();
        if (externalId == null || externalId.isBlank() || serviceKey.isBlank()) {
            return fallback(program);
        }

        CacheEntry cached = cache.get(externalId);
        if (cached != null && cached.cachedAt().plus(CACHE_TTL).isAfter(Instant.now())) {
            return cached.detail();
        }

        try {
            CompletableFuture<JsonNode> listFuture = fetchOne(LIST_URL, externalId);
            CompletableFuture<JsonNode> detailFuture = fetchOne(DETAIL_URL, externalId);
            CompletableFuture.allOf(listFuture, detailFuture).join();
            JsonNode list = listFuture.join();
            JsonNode detail = detailFuture.join();
            ProgramDetail result = map(program, list, detail);
            cache.put(externalId, new CacheEntry(result, Instant.now()));
            return result;
        } catch (Exception error) {
            log.warn("Could not load live detail for public service {}: {}", externalId, error.getMessage());
            return fallback(program);
        }
    }

    private CompletableFuture<JsonNode> fetchOne(String baseUrl, String externalId) {
        String condition = URLEncoder.encode("cond[서비스ID::EQ]", StandardCharsets.UTF_8);
        String value = URLEncoder.encode(externalId, StandardCharsets.UTF_8);
        URI uri = URI.create(baseUrl + "?page=1&perPage=1&returnType=JSON&" + condition + "=" + value);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .header("Authorization", "Infuser " + serviceKey)
                .GET()
                .build();
        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        throw new IllegalStateException("Public detail API returned status " + response.statusCode());
                    }
                    try {
                        JsonNode data = objectMapper.readTree(response.body()).path("data");
                        return data.isArray() && !data.isEmpty() ? data.get(0) : objectMapper.createObjectNode();
                    } catch (Exception error) {
                        throw new IllegalStateException("Public detail API response could not be parsed", error);
                    }
                });
    }

    private ProgramDetail map(SupportProgram program, JsonNode list, JsonNode detail) {
        String summary = pick(list, detail, program.getSummary(), "서비스목적요약", "서비스목적");
        String purpose = pick(detail, list, summary, "서비스목적", "서비스목적요약");
        String target = pick(list, detail, program.getTarget(), "지원대상", "사용자구분");
        String benefit = pick(list, detail, program.getBenefit(), "지원내용");
        String criteria = pick(detail, list, "", "선정기준", "지원조건", "지원자격");
        String applicationMethod = pick(detail, list, "", "신청방법");
        String agency = pick(list, detail, "", "소관기관명", "소관기관");
        String department = pick(list, detail, "", "부서명", "소관부서명");
        String receptionAgency = pick(detail, list, "", "접수기관명", "접수기관");
        String contact = pick(detail, list, "", "문의처", "전화문의", "문의전화");
        String requiredDocuments = pick(detail, list, "", "민원인제출서류", "민원인 제출서류",
                "민원인이 제출해야 하는 서류", "구비서류");
        String officialDocuments = pick(detail, list, "", "공무원확인 구비서류", "공무원확인구비서류",
                "민원인이 제출하지 않아도 되는 서류(담당공무원 확인)");
        String identityDocuments = pick(detail, list, "", "본인확인필요 구비서류", "본인확인필요구비서류",
                "민원인이 제출하지 않아도 되는 서류(본인정보제공 요구)");
        String onlineUrl = pick(detail, list, program.getApplyUrl(), "온라인신청사이트URL", "온라인신청URL", "상세조회URL");
        String legalBasis = pick(detail, list, "", "법령", "근거법령");
        String updatedAt = pick(detail, list, "", "수정일시", "최종수정일", "데이터기준일자");
        return new ProgramDetail(summary, purpose, target, benefit, criteria, applicationMethod,
                program.getDeadline(), agency, department, receptionAgency, contact,
                requiredDocuments, officialDocuments, identityDocuments, onlineUrl,
                legalBasis, updatedAt, !list.isEmpty() || !detail.isEmpty());
    }

    private ProgramDetail fallback(SupportProgram program) {
        return new ProgramDetail(program.getSummary(), program.getSummary(), program.getTarget(),
                program.getBenefit(), "", "", program.getDeadline(), "", "", "", "",
                "", "", "", program.getApplyUrl(), "", "", false);
    }

    private String pick(JsonNode first, JsonNode second, String fallback, String... names) {
        for (String name : names) {
            String value = normalize(first.get(name));
            if (!value.isBlank()) return value;
        }
        for (String name : names) {
            String value = normalize(second.get(name));
            if (!value.isBlank()) return value;
        }
        return fallback == null ? "" : fallback;
    }

    private String normalize(JsonNode node) {
        if (node == null || node.isNull()) return "";
        List<String> values = new ArrayList<>();
        collect(node, values);
        return String.join("\n", values).replace("||", "\n")
                .replaceAll("[ \\t]+", " ")
                .replaceAll(" *\\n *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private void collect(JsonNode node, List<String> values) {
        if (node == null || node.isNull()) return;
        if (node.isValueNode()) {
            String value = node.asText("").trim();
            if (!value.isBlank()) values.add(value);
            return;
        }
        if (node.isArray()) {
            node.forEach(value -> collect(value, values));
            return;
        }
        Iterator<JsonNode> iterator = node.elements();
        while (iterator.hasNext()) collect(iterator.next(), values);
    }

    private String decodeIfNeeded(String value) {
        if (!value.contains("%")) return value;
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    public record ProgramDetail(
            String summary,
            String purpose,
            String target,
            String benefit,
            String criteria,
            String applicationMethod,
            String deadline,
            String agency,
            String department,
            String receptionAgency,
            String contact,
            String requiredDocuments,
            String officialDocuments,
            String identityDocuments,
            String onlineUrl,
            String legalBasis,
            String sourceUpdatedAt,
            boolean sourceLive) {}

    private record CacheEntry(ProgramDetail detail, Instant cachedAt) {}
}
