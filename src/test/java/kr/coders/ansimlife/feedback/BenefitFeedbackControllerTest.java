package kr.coders.ansimlife.feedback;

import kr.coders.ansimlife.support.SupportProgram;
import kr.coders.ansimlife.support.SupportProgramRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BenefitFeedbackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BenefitFeedbackRepository feedbackRepository;

    @Autowired
    private SupportProgramRepository programRepository;

    private Long programId;

    @BeforeEach
    void setUp() {
        feedbackRepository.deleteAll();
        programRepository.deleteAll();
        programId = programRepository.save(new SupportProgram(
                "청년 주거 지원", "서울", "주거·자립", "서울 거주 청년",
                "청년 주거비를 지원합니다.", "월세 지원", "https://example.com/youth", "상시", false)).getId();
    }

    @Test
    void acceptsBenefitQualityFeedbackWithoutPersonalData() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"programId":%d,"type":"WRONG_DEADLINE","message":"공식 공고의 마감일과 달라요."}
                                """.formatted(programId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("제보가 접수됐어요."));
    }

    @Test
    void rejectsUnknownProgram() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programId\":999999,\"type\":\"OTHER\",\"message\":\"확인 내용입니다.\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("혜택")));
    }

    @Test
    void rejectsShortMessage() throws Exception {
        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"programId":%d,"type":"OTHER","message":"짧음"}
                                """.formatted(programId)))
                .andExpect(status().isBadRequest());
    }
}
