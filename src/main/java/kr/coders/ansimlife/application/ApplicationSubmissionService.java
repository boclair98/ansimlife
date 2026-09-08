package kr.coders.ansimlife.application;

import kr.coders.ansimlife.support.SupportProgram;
import kr.coders.ansimlife.support.SupportProgramRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationSubmissionService {

    private final ApplicationDraftRepository draftRepository;
    private final SupportProgramRepository programRepository;
    private final ApplicationConnectorRegistry connectorRegistry;

    public ApplicationSubmissionService(ApplicationDraftRepository draftRepository,
                                        SupportProgramRepository programRepository,
                                        ApplicationConnectorRegistry connectorRegistry) {
        this.draftRepository = draftRepository;
        this.programRepository = programRepository;
        this.connectorRegistry = connectorRegistry;
    }

    @Transactional
    public ApplicationDraft submit(Long draftId, String ownerKey) {
        ApplicationDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!draft.getCodersUser().equals(ownerKey)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (draft.isExternallySubmitted()) {
            return draft;
        }

        SupportProgram program = programRepository.findById(draft.getProgramId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원사업을 찾을 수 없습니다."));
        BenefitApplicationConnector connector = connectorRegistry.connectorFor(program)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "아직 이 지원의 기관 접수 API가 연결되지 않았어요. 신청서는 저장되지만 실제 접수로 처리하지 않습니다."));

        draft.requireReadyForExternalSubmission();
        ExternalApplicationReceipt receipt = connector.submit(
                ExternalApplicationRequest.from(draft, program.getExternalId(), program.getTitle()));
        if (receipt == null || receipt.receiptNumber() == null || receipt.receiptNumber().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "접수기관에서 접수번호를 반환하지 않아 신청 완료로 처리하지 않았어요.");
        }

        draft.completeExternalSubmission(connector.providerCode(), receipt);
        return draftRepository.saveAndFlush(draft);
    }
}
