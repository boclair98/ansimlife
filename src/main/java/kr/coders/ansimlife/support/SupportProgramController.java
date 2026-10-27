package kr.coders.ansimlife.support;

import kr.coders.ansimlife.application.ApplicationChannel;
import kr.coders.ansimlife.application.ApplicationConnectorRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;
import org.springframework.http.CacheControl;
import java.io.IOException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

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
    private final BenefitGuidePdfService guidePdfService;

    public SupportProgramController(SupportProgramRepository repository,
                                    PublicServiceSyncService syncService,
                                    PublicServiceDetailService detailService,
                                    ApplicationConnectorRegistry connectorRegistry,
                                    SupportProgramAudienceMatcher audienceMatcher,
                                    BenefitGuidePdfService guidePdfService) {
        this.repository = repository;
        this.syncService = syncService;
        this.detailService = detailService;
        this.connectorRegistry = connectorRegistry;
        this.audienceMatcher = audienceMatcher;
        this.guidePdfService = guidePdfService;
    }

    @GetMapping
    public SearchResponse search(
            @RequestParam(defaultValue = "") String region,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String topic,
            @RequestParam(defaultValue = "") String age,
            @RequestParam(defaultValue = "") String household,
            @RequestParam(defaultValue = "") String filter,
            @RequestParam(defaultValue = "recommended") String sort,
            @RequestParam(defaultValue = "false") boolean hideClosed,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        String normalizedRegion = region.trim();
        String normalizedCategory = category.trim();
        String normalizedKeyword = keyword.trim();
        String normalizedTopic = topic.trim();
        String normalizedAge = age.trim();
        String normalizedHousehold = household.trim();
        String normalizedFilter = filter.trim();
        String normalizedSort = sort.trim();
        int normalizedPage = Math.max(0, page);
        int normalizedSize = Math.max(12, Math.min(size, 60));

        if (!BenefitTopic.supports(normalizedTopic)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 상황별 모아보기입니다.");
        }
        if (!audienceMatcher.supportsAgeGroup(normalizedAge)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 연령대입니다.");
        }
        if (!audienceMatcher.supportsHousehold(normalizedHousehold)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 가구 상황입니다.");
        }
        if (!normalizedFilter.isEmpty() && !normalizedFilter.equals("online")
                && !normalizedFilter.equals("urgent") && !normalizedFilter.equals("matched")) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 혜택 필터입니다.");
        }
        if (!Set.of("recommended", "deadline", "online").contains(normalizedSort)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 정렬 방식입니다.");
        }

        // Deadline and audience data are derived from public-data text. Evaluate and
        // sort all filtered candidates before paging, so later pages cannot outrank
        // earlier ones. Revisit a persisted search index if the catalogue grows.
        List<SearchCandidate> matches = repository.searchCandidates(
                        normalizedRegion, normalizedCategory, normalizedKeyword,
                        normalizedFilter.equals("matched") ? "" : normalizedFilter).stream()
                .filter(program -> BenefitTopic.matches(program, normalizedTopic))
                .filter(program -> audienceMatcher.matches(program, normalizedAge, normalizedHousehold))
                .map(program -> new SearchCandidate(program, BenefitDeadline.analyze(program.getDeadline()),
                        audienceMatcher.explain(program, normalizedAge, normalizedHousehold).status()))
                .filter(candidate -> !normalizedFilter.equals("matched") || candidate.audienceStatus().equals("MATCHED"))
                .filter(candidate -> !hideClosed || !candidate.deadline().expired())
                .sorted(searchOrder(normalizedSort))
                .toList();
        long offset = (long) normalizedPage * normalizedSize;
        int from = (int) Math.min(offset, matches.size());
        int to = Math.min(from + normalizedSize, matches.size());
        List<ProgramResponse> items = matches.subList(from, to).stream()
                .map(candidate -> toResponse(candidate.program(), normalizedAge, normalizedHousehold))
                .toList();
        return new SearchResponse(items, normalizedPage, normalizedSize, matches.size(), to < matches.size());
    }

    private Comparator<SearchCandidate> searchOrder(String sort) {
        Comparator<SearchCandidate> recommended = Comparator
                .comparingInt(SearchCandidate::recommendationScore).reversed()
                .thenComparing(candidate -> candidate.program().getId());
        return switch (sort) {
            case "deadline" -> Comparator.comparingInt(SearchCandidate::deadlineBucket)
                    .thenComparing(candidate -> candidate.deadline().lastDate(), Comparator.nullsLast(LocalDate::compareTo))
                    .thenComparing(recommended);
            case "online" -> Comparator.comparing(SearchCandidate::hasOnlineAddress).reversed()
                    .thenComparing(recommended);
            default -> recommended;
        };
    }

    private record SearchCandidate(SupportProgram program, BenefitDeadline.Info deadline, String audienceStatus) {
        boolean hasOnlineAddress() {
            return program.getApplyUrl() != null && !program.getApplyUrl().isBlank();
        }

        int recommendationScore() {
            return (audienceStatus.equals("MATCHED") ? 8 : 0)
                    + (deadline.urgent() ? 4 : 0) - (deadline.expired() ? 8 : 0)
                    + (hasOnlineAddress() ? 2 : 0);
        }

        int deadlineBucket() {
            return deadline.expired() ? 2 : deadline.lastDate() == null ? 1 : 0;
        }
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
                program.getId(), program.getExternalId(), program.getTitle(),
                BenefitPresentation.region(program.getRegion(), program.getTitle()),
                BenefitPresentation.category(program.getCategory(), program.getTitle()), detail.summary(), detail.purpose(), detail.target(), detail.benefit(),
                detail.criteria(), detail.applicationMethod(), detail.deadline(), detail.agency(),
                detail.department(), detail.receptionAgency(), detail.contact(), detail.requiredDocuments(),
                detail.officialDocuments(), detail.identityDocuments(), detail.onlineUrl(), detail.legalBasis(),
                detail.sourceUpdatedAt(), detail.sourceLive(), connectorRegistry.describe(program));
    }

    @GetMapping(value = "/{id}/guide.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> guide(@PathVariable Long id) throws IOException {
        SupportProgram program = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "지원 정보를 찾을 수 없습니다."));
        byte[] pdf = guidePdfService.render(program, detailService.find(program));
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("ansimlife-benefit-" + id + ".pdf").build().toString()).body(pdf);
    }

    private ProgramResponse toResponse(SupportProgram program, String ageGroup, String household) {
        SupportProgramAudienceMatcher.AudienceFit fit = audienceMatcher.explain(program, ageGroup, household);
        String displayCategory = BenefitPresentation.category(program.getCategory(), program.getTitle());
        String displayRegion = BenefitPresentation.region(program.getRegion(), program.getTitle());
        BenefitDeadline.Info deadline = BenefitDeadline.analyze(program.getDeadline());
        return new ProgramResponse(
                program.getId(), program.getExternalId(), program.getTitle(), displayRegion,
                displayCategory, program.getTarget(), program.getSummary(), program.getBenefit(),
                program.getApplyUrl(), program.getDeadline(), deadline.lastDate(), deadline.status(), deadline.label(),
                deadline.urgent(), deadline.expired(), connectorRegistry.describe(program),
                fit.status(), fit.reason());
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
            LocalDate deadlineDate,
            String deadlineStatus,
            String deadlineLabel,
            boolean urgent,
            boolean expired,
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
