package kr.coders.ansimlife.support;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

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
                .andExpect(jsonPath("$.items[*].title", not(hasItem("독거노인 주거 안전 지원"))));
    }

    @Test
    void unsupportedAudienceValueIsRejected() throws Exception {
        mockMvc.perform(get("/api/programs").param("age", "잘못된 연령"))
                .andExpect(status().isBadRequest());
    }
}
