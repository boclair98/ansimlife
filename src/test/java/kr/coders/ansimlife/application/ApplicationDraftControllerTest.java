package kr.coders.ansimlife.application;

import kr.coders.ansimlife.account.AuthController;
import kr.coders.ansimlife.support.SupportProgram;
import kr.coders.ansimlife.support.SupportProgramRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationDraftControllerTest {

    @Mock ApplicationDraftRepository draftRepository;
    @Mock SupportProgramRepository programRepository;
    @Mock ApplicationConnectorRegistry connectorRegistry;

    @Test
    void savesPartialChecklistForSignedInUser() {
        ApplicationDraftController controller = controller();
        SupportProgram program = new SupportProgram("복지 지원", "전국", "생활안정", "대상", "요약", "내용", null, "상시", false);
        when(programRepository.findById(11L)).thenReturn(Optional.of(program));
        when(draftRepository.findByCodersUserAndProgramId("7", 11L)).thenReturn(Optional.empty());
        when(draftRepository.saveAndFlush(any(ApplicationDraft.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationDraftController.DraftResponse response = controller.save(
                new ApplicationDraftController.DraftRequest(11L, true, false, List.of("target", "route")),
                sessionFor(7L));

        assertThat(response.checkedItems()).containsExactly("target", "route");
        assertThat(response.documentsReady()).isFalse();
        assertThat(response.completionPercent()).isEqualTo(60);
        assertThat(response.status()).isEqualTo("DRAFT");
    }

    @Test
    void rejectsUnknownChecklistItemBeforeSaving() {
        ApplicationDraftController controller = controller();
        when(programRepository.findById(11L)).thenReturn(Optional.of(
                new SupportProgram("복지 지원", "전국", "생활안정", "대상", "요약", "내용", null, "상시", false)));
        when(draftRepository.findByCodersUserAndProgramId("7", 11L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.save(
                new ApplicationDraftController.DraftRequest(11L, true, false, List.of("unknown")), sessionFor(7L)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("준비 항목");
        verify(draftRepository, never()).saveAndFlush(any());
    }

    @Test
    void anonymousDraftListDoesNotCreateSession() {
        ApplicationDraftController controller = controller();
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThat(controller.list(request)).isEmpty();
        assertThat(request.getSession(false)).isNull();
    }

    private ApplicationDraftController controller() {
        return new ApplicationDraftController(draftRepository, programRepository, connectorRegistry);
    }

    @Test
    void otherAccountCannotDeleteOrChangeDraft() {
        ApplicationDraftController controller = controller();
        ApplicationDraft draft = new ApplicationDraft("7", 11L);
        when(draftRepository.findById(100L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> controller.delete(100L, sessionFor(8L)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
        assertThatThrownBy(() -> controller.updateJourney(100L,
                new ApplicationDraftController.JourneyRequest("APPROVED", null, null), sessionFor(8L)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
        verify(draftRepository, never()).delete(any());
        verify(draftRepository, never()).saveAndFlush(any());
        assertThat(draft.getJourneyStatus()).isEqualTo("PREPARING");
    }

    private MockHttpSession sessionFor(Long userId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthController.SESSION_USER_ID, userId);
        return session;
    }
}
