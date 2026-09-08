package kr.coders.ansimlife.application;

import jakarta.servlet.http.HttpSession;
import kr.coders.ansimlife.account.AuthController;
import kr.coders.ansimlife.support.SupportProgram;
import kr.coders.ansimlife.support.SupportProgramRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationDraftController {

    private final ApplicationDraftRepository draftRepository;
    private final SupportProgramRepository programRepository;
    private final ApplicationConnectorRegistry connectorRegistry;

    public ApplicationDraftController(ApplicationDraftRepository draftRepository,
                                      SupportProgramRepository programRepository,
                                      ApplicationConnectorRegistry connectorRegistry) {
        this.draftRepository = draftRepository;
        this.programRepository = programRepository;
        this.connectorRegistry = connectorRegistry;
    }

    @GetMapping("/drafts")
    @Transactional(readOnly = true)
    public List<DraftResponse> list(HttpSession session) {
        Long userId = AuthController.sessionUserId(session);
        if (userId == null) {
            return List.of();
        }
        return draftRepository.findAllByCodersUserOrderByUpdatedAtDesc(userId.toString()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/drafts")
    @Transactional
    public DraftResponse save(@RequestBody DraftRequest request, HttpSession session) {
        if (request == null || request.programId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원사업을 선택해주세요.");
        }
        String ownerKey = AuthController.requireSessionUserId(session).toString();
        programRepository.findById(request.programId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원사업을 찾을 수 없습니다."));

        ApplicationDraft draft = draftRepository.findByCodersUserAndProgramId(ownerKey, request.programId())
                .orElseGet(() -> new ApplicationDraft(ownerKey, request.programId()));
        try {
            draft.update(request.eligibilityConfirmed(), request.documentsReady());
        } catch (IllegalStateException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, error.getMessage());
        }
        return toResponse(draftRepository.saveAndFlush(draft));
    }

    @DeleteMapping("/drafts/{id}")
    @Transactional
    public void delete(@PathVariable Long id, HttpSession session) {
        ApplicationDraft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!draft.getCodersUser().equals(AuthController.requireSessionUserId(session).toString())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        draftRepository.delete(draft);
    }

    @PostMapping("/drafts/{id}/journey")
    @Transactional
    public DraftResponse updateJourney(@PathVariable Long id,
                                       @RequestBody JourneyRequest request,
                                       HttpSession session) {
        ApplicationDraft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!draft.getCodersUser().equals(AuthController.requireSessionUserId(session).toString())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (request == null || request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "진행 상태를 선택해주세요.");
        }
        try {
            draft.updateJourney(
                    request.status().trim().toUpperCase(),
                    limit(request.receiptMemo(), 120),
                    parseDate(request.nextActionDate()));
        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage());
        } catch (IllegalStateException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, error.getMessage());
        }
        return toResponse(draftRepository.saveAndFlush(draft));
    }

    private DraftResponse toResponse(ApplicationDraft draft) {
        SupportProgram program = programRepository.findById(draft.getProgramId()).orElse(null);
        return new DraftResponse(
                draft.getId(), draft.getProgramId(),
                program == null ? "삭제된 지원" : program.getTitle(),
                program == null ? null : program.getApplyUrl(),
                program == null ? null : connectorRegistry.describe(program),
                draft.isEligibilityConfirmed(), draft.isDocumentsReady(),
                draft.getStatus(), draft.getCompletionPercent(), draft.getUpdatedAt(), draft.getSubmittedAt(),
                draft.getSubmissionProvider(), draft.getExternalReceiptNumber(),
                draft.getExternalApplicationId(), draft.getExternalAgency(),
                draft.getJourneyStatus(), draft.getUserReceiptMemo(), draft.getNextActionDate(),
                draft.getOfficialSiteOpenedAt(), draft.getUserReportedSubmittedAt());
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "다음 확인일을 올바르게 입력해주세요.");
        }
    }

    private String limit(String value, int maxLength) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입력값이 너무 깁니다.");
        }
        return normalized;
    }

    public record DraftRequest(
            Long programId,
            boolean eligibilityConfirmed,
            boolean documentsReady) {
    }

    public record DraftResponse(
            Long id,
            Long programId,
            String programTitle,
            String officialUrl,
            ApplicationChannel application,
            boolean eligibilityConfirmed,
            boolean documentsReady,
            String status,
            int completionPercent,
            LocalDateTime updatedAt,
            LocalDateTime submittedAt,
            String submissionProvider,
            String externalReceiptNumber,
            String externalApplicationId,
            String externalAgency,
            String journeyStatus,
            String userReceiptMemo,
            LocalDate nextActionDate,
            LocalDateTime officialSiteOpenedAt,
            LocalDateTime userReportedSubmittedAt) {
    }


    public record JourneyRequest(String status, String receiptMemo, String nextActionDate) {}
}
