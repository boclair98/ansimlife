package kr.coders.ansimlife.support;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import kr.coders.ansimlife.application.ApplicationChannel;
import kr.coders.ansimlife.application.ApplicationConnectorRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/programs")
public class SupportProgramController {

    private final SupportProgramRepository repository;
    private final PublicServiceSyncService syncService;
    private final PublicServiceDetailService detailService;
    private final ApplicationConnectorRegistry connectorRegistry;
    private final SupportProgramAudienceMatcher audienceMatcher;

    public SupportProgramController(SupportProgramRepository repository,
                                    PublicServiceSyncService syncService,
                                    PublicServiceDetailService detailService,
                                    ApplicationConnectorRegistry connectorRegistry,
                                    SupportProgramAudienceMatcher audienceMatcher) {
        this.repository = repository;
        this.syncService = syncService;
        this.detailService = detailService;
        this.connectorRegistry = connectorRegistry;
        this.audienceMatcher = audienceMatcher;
    }

    @GetMapping
    public SearchResponse search(
            @RequestParam(defaultValue = "") String region,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String age,
            @RequestParam(defaultValue = "") String household,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        String normalizedRegion = region.trim();
        String normalizedCategory = category.trim();
        String normalizedKeyword = keyword.trim();
        String normalizedAge = age.trim();
        String normalizedHousehold = household.trim();
        int normalizedPage = Math.max(0, page);
        int normalizedSize = Math.max(12, Math.min(size, 60));

        if (!audienceMatcher.supportsAgeGroup(normalizedAge)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 연령대입니다.");
        }
        if (!audienceMatcher.supportsHousehold(normalizedHousehold)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 가구 상황입니다.");
        }

        if (!normalizedAge.isEmpty() || !normalizedHousehold.isEmpty()) {
            List<SupportProgram> matches = repository.searchCandidates(
                            normalizedRegion, normalizedCategory, normalizedKeyword).stream()
                    .filter(program -> audienceMatcher.matches(program, normalizedAge, normalizedHousehold))
                    .toList();
            long offset = (long) normalizedPage * normalizedSize;
            int from = (int) Math.min(offset, matches.size());
            int to = Math.min(from + normalizedSize, matches.size());
            List<ProgramResponse> items = matches.subList(from, to).stream()
                    .map(program -> toResponse(program, normalizedAge, normalizedHousehold))
                    .toList();
            return new SearchResponse(items, normalizedPage, normalizedSize, matches.size(), to < matches.size());
        }

        Page<SupportProgram> result = repository.search(normalizedRegion, normalizedCategory, normalizedKeyword,
                PageRequest.of(normalizedPage, normalizedSize));
        return new SearchResponse(result.getContent().stream()
                .map(program -> toResponse(program, normalizedAge, normalizedHousehold)).toList(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.hasNext());
    }

    @GetMapping("/meta")
    public MetaResponse meta() {
        List<CategorySummary> categories = repository.categoryTotals().stream()
                .map(value -> new CategorySummary(value.getCategory(), value.getTotal()))
                .toList();
        return new MetaResponse(repository.count(), syncService.getTotalAvailable(), syncService.getStatus(),
                syncService.getLastSyncedAt(), categories);
    }

    @GetMapping("/{id}")
    public ProgramResponse get(@PathVariable Long id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "지원 정보를 찾을 수 없습니다.")), "", "");
    }

    @GetMapping("/{id}/detail")
    public ProgramDetailResponse detail(@PathVariable Long id) {
        SupportProgram program = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "지원 정보를 찾을 수 없습니다."));
        PublicServiceDetailService.ProgramDetail detail = detailService.find(program);
        return new ProgramDetailResponse(
                program.getId(), program.getExternalId(), program.getTitle(), program.getRegion(),
                program.getCategory(), detail.summary(), detail.purpose(), detail.target(), detail.benefit(),
                detail.criteria(), detail.applicationMethod(), detail.deadline(), detail.agency(),
                detail.department(), detail.receptionAgency(), detail.contact(), detail.requiredDocuments(),
                detail.officialDocuments(), detail.identityDocuments(), detail.onlineUrl(), detail.legalBasis(),
                detail.sourceUpdatedAt(), detail.sourceLive(), connectorRegistry.describe(program));
    }

    private ProgramResponse toResponse(SupportProgram program, String ageGroup, String household) {
        SupportProgramAudienceMatcher.AudienceFit fit = audienceMatcher.explain(program, ageGroup, household);
        return new ProgramResponse(
                program.getId(), program.getExternalId(), program.getTitle(), program.getRegion(),
                program.getCategory(), program.getTarget(), program.getSummary(), program.getBenefit(),
                program.getApplyUrl(), program.getDeadline(), program.isUrgent(),
                connectorRegistry.describe(program), fit.status(), fit.reason());
    }

    public record ProgramResponse(
            Long id,
            String externalId,
            String title,
            String region,
            String category,
            String target,
            String summary,
            String benefit,
            String applyUrl,
            String deadline,
            boolean urgent,
            ApplicationChannel application,
            String audienceStatus,
            String audienceReason) {}
    public record ProgramDetailResponse(
            Long id,
            String externalId,
            String title,
            String region,
            String category,
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
            boolean sourceLive,
            ApplicationChannel application) {}
    public record SearchResponse(List<ProgramResponse> items, int page, int size, long total, boolean hasMore) {}
    public record CategorySummary(String category, long count) {}
    public record MetaResponse(long storedCount, int totalAvailable, String syncStatus,
                               Instant lastSyncedAt, List<CategorySummary> categories) {}
}
