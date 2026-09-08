package kr.coders.ansimlife.application;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApplicationDraftTest {

    @Test
    void completePreparationProducesReadyState() {
        ApplicationDraft draft = new ApplicationDraft("7", 11L);

        draft.update(
                "홍길동", "010-1234-5678", "1995", "서울시 마포구",
                "1인 가구", "100만~200만원", "",
                true, true, true);

        assertThat(draft.getStatus()).isEqualTo("READY_TO_SUBMIT");
        assertThat(draft.getCompletionPercent()).isEqualTo(100);
        assertThat(draft.getJourneyStatus()).isEqualTo("PREPARING");
    }

    @Test
    void userReportedSubmissionIsNotInstitutionSubmission() {
        ApplicationDraft draft = new ApplicationDraft("7", 11L);

        draft.updateJourney(
                "USER_REPORTED_SUBMITTED",
                "정부24에서 신청했다고 기록",
                LocalDate.of(2026, 9, 15));

        assertThat(draft.getJourneyStatus()).isEqualTo("USER_REPORTED_SUBMITTED");
        assertThat(draft.getUserReceiptMemo()).isEqualTo("정부24에서 신청했다고 기록");
        assertThat(draft.getNextActionDate()).isEqualTo(LocalDate.of(2026, 9, 15));
        assertThat(draft.isExternallySubmitted()).isFalse();
        assertThat(draft.getExternalReceiptNumber()).isNull();
    }

    @Test
    void institutionReceiptCannotBeConfusedWithUserTracking() {
        ApplicationDraft draft = new ApplicationDraft("7", 11L);
        draft.completeExternalSubmission(
                "partner-api",
                new ExternalApplicationReceipt("R-2026-0001", "external-1", "테스트 접수기관", LocalDateTime.now()));

        assertThat(draft.getJourneyStatus()).isEqualTo("INSTITUTION_CONFIRMED");
        assertThat(draft.isExternallySubmitted()).isTrue();
        assertThatThrownBy(() -> draft.updateJourney("APPROVED", null, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void unsupportedJourneyStatusIsRejected() {
        ApplicationDraft draft = new ApplicationDraft("7", 11L);

        assertThatThrownBy(() -> draft.updateJourney("SUBMITTED", null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
