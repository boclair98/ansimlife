package kr.coders.ansimlife.support;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SupportProgramControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SupportProgramRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        repository.save(new SupportProgram(
                "청년 월세 지원", "서울", "주거·자립", "19~39세 청년 1인 가구",
                "청년 주거비를 지원합니다.", "월세 지원", "https://example.com/youth", "상시", false));
        repository.save(new SupportProgram(
                "독거노인 주거 안전 지원", "서울", "주거·자립", "서울 거주 만 65세 이상 독거노인",
                "노인 주거 안전을 지원합니다.", "안전장비 지원", "https://example.com/senior", "상시", false));
        repository.save(new SupportProgram(
                "시민 주거상담", "서울", "주거·자립", "서울 시민 누구나",
                "주거 상담을 제공합니다.", "무료 상담", "https://example.com/general", "상시", false));
    }

    @Test
    void youthDiagnosisExcludesSeniorOnlyProgramAtApiBoundary() throws Exception {
        mockMvc.perform(get("/api/programs")
                        .param("region", "서울")
                        .param("category", "주거·자립")
                        .param("age", "청년")
                        .param("household", "1인 가구")
                        .param("page", "0")
                        .param("size", "24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[*].title", containsInAnyOrder("청년 월세 지원", "시민 주거상담")))
                .andExpect(jsonPath("$.items[*].audienceStatus", containsInAnyOrder("MATCHED", "GENERAL")))
                .andExpect(jsonPath("$.items[*].title", not(hasItem("독거노인 주거 안전 지원"))));
    }

    @Test
    void unsupportedAudienceValueIsRejected() throws Exception {
        mockMvc.perform(get("/api/programs").param("age", "잘못된 연령"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deadlineOrderIsGlobalAndStableAcrossPages() throws Exception {
        repository.deleteAll();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        // Insert the earliest deadline first: the old id-desc page would miss it.
        for (int i = 0; i < 15; i++) {
            saveProgram("마감 " + i, "서울 시민 누구나", today.plusDays(i + 1).toString(), "");
        }

        mockMvc.perform(get("/api/programs").param("sort", "deadline").param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(15))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.items.length()").value(12))
                .andExpect(jsonPath("$.items[0].title").value("마감 0"))
                .andExpect(jsonPath("$.items[11].title").value("마감 11"));
        mockMvc.perform(get("/api/programs").param("sort", "deadline").param("size", "12").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].title").value("마감 12"))
                .andExpect(jsonPath("$.items[2].title").value("마감 14"));
    }

    @Test
    void recommendationsPrioritizeAudienceMatchesBeforePagination() throws Exception {
        repository.deleteAll();
        saveProgram("맞춤 청년 지원", "19~39세 청년", "상시", "");
        for (int i = 0; i < 13; i++) {
            saveProgram("일반 지원 " + i, "시민 누구나", "상시", "https://example.com/apply");
        }
        saveProgram("노인 전용 지원", "만 65세 이상 노인", "상시", "");

        mockMvc.perform(get("/api/programs").param("sort", "recommended").param("age", "청년").param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(14))
                .andExpect(jsonPath("$.items[0].title").value("맞춤 청년 지원"))
                .andExpect(jsonPath("$.items[0].audienceStatus").value("MATCHED"))
                .andExpect(jsonPath("$.items[*].title", not(hasItem("노인 전용 지원"))));
    }

    @Test
    void onlineOrderPromotesAddressesBeyondTheOriginalFirstPage() throws Exception {
        repository.deleteAll();
        saveProgram("온라인 안내", "시민 누구나", "상시", "https://example.com/apply");
        for (int i = 0; i < 13; i++) saveProgram("방문 안내 " + i, "시민 누구나", "상시", "");

        mockMvc.perform(get("/api/programs").param("sort", "online").param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(14))
                .andExpect(jsonPath("$.items[0].title").value("온라인 안내"));
    }

    @Test
    void hidingClosedUpdatesTotalsAndRetainsUnknownDeadlines() throws Exception {
        repository.deleteAll();
        saveProgram("종료된 안내", "시민 누구나", "2020-01-01 ~ 2020-01-31", "");
        saveProgram("상시 안내", "시민 누구나", "상시", "");
        saveProgram("기간 확인 안내", "시민 누구나", "기관 공고 확인", "");

        mockMvc.perform(get("/api/programs").param("hideClosed", "true").param("sort", "deadline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[*].title", containsInAnyOrder("상시 안내", "기간 확인 안내")));
        mockMvc.perform(get("/api/programs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3));
    }

    @Test
    void matchedFilterDoesNotReturnGeneralProgramsWithoutAudienceCriteria() throws Exception {
        mockMvc.perform(get("/api/programs").param("filter", "matched"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
        mockMvc.perform(get("/api/programs").param("filter", "matched").param("age", "청년"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].title").value("청년 월세 지원"));
    }

    @Test
    void invalidSortAndInputHaveUsableErrorMessages() throws Exception {
        mockMvc.perform(get("/api/programs").param("sort", "unknown"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
        mockMvc.perform(get("/api/programs").param("page", "invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("입력한 내용을 확인해주세요."));
    }

    @Test
    void topicCombinesRelatedTermsAndStillRespectsRegionAndKeyword() throws Exception {
        repository.save(new SupportProgram("이사비 지원", "부산", "생활안정", "부산 시민",
                "이사 비용 안내", "운반비", "", "상시", false));
        mockMvc.perform(get("/api/programs").param("topic", "housing").param("region", "서울"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(3));
        mockMvc.perform(get("/api/programs").param("topic", "housing").param("region", "부산").param("keyword", "운반비"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].title").value("이사비 지원"));
        mockMvc.perform(get("/api/programs").param("topic", "culture"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void topicFilteringHappensBeforeTotalsAndDeadlinePagination() throws Exception {
        repository.deleteAll();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        for (int i = 0; i < 15; i++) saveProgram("주거 지원 " + i, "시민", today.plusDays(i + 1).toString(), "");
        for (int i = 0; i < 4; i++) saveProgram("스포츠 지원 " + i, "시민", "상시", "");
        mockMvc.perform(get("/api/programs").param("topic", "housing").param("sort", "deadline").param("size", "12").param("page", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(15))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].title").value("주거 지원 12"))
                .andExpect(jsonPath("$.items[0].deadlineDate").value(today.plusDays(13).toString()));
    }

    @Test
    void unknownTopicIsRejectedRatherThanReturningUnrelatedBenefits() throws Exception {
        mockMvc.perform(get("/api/programs").param("topic", "unknown"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void publicGuideDownloadReturnsKoreanPdfAndRejectsMissingProgram() throws Exception {
        Long id = repository.findAll().getFirst().getId();
        var result = mockMvc.perform(get("/api/programs/" + id + "/guide.pdf"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType("application/pdf"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Cache-Control", "no-store"))
                .andReturn();
        try (var document = org.apache.pdfbox.Loader.loadPDF(result.getResponse().getContentAsByteArray())) {
            org.assertj.core.api.Assertions.assertThat(new org.apache.pdfbox.text.PDFTextStripper().getText(document)).contains("안심생활", "지원 대상");
        }
        mockMvc.perform(get("/api/programs/999999999/guide.pdf")).andExpect(status().isNotFound());
    }

    private void saveProgram(String title, String target, String deadline, String applyUrl) {
        repository.save(new SupportProgram(title, "서울", "주거·자립", target,
                "지원 안내", "지원 내용", applyUrl, deadline, false));
    }
}
