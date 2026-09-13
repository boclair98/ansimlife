package kr.coders.ansimlife.feedback;

import kr.coders.ansimlife.support.SupportProgramRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/feedback")
public class BenefitFeedbackController {

    private final BenefitFeedbackRepository feedbackRepository;
    private final SupportProgramRepository programRepository;

    public BenefitFeedbackController(BenefitFeedbackRepository feedbackRepository,
                                     SupportProgramRepository programRepository) {
        this.feedbackRepository = feedbackRepository;
        this.programRepository = programRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse create(@RequestBody FeedbackRequest request) {
        if (request == null || request.programId() == null || request.programId() < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "제보할 혜택을 확인해주세요.");
        }
        if (!programRepository.existsById(request.programId())) {
            throw new ResponseStatusException(NOT_FOUND, "제보할 혜택을 찾을 수 없습니다.");
        }

        BenefitFeedback.FeedbackType type = parseType(request.type());
        String message = request.message() == null ? "" : request.message().trim();
        if (message.length() < 5 || message.length() > 500) {
            throw new ResponseStatusException(BAD_REQUEST, "확인한 내용을 5자 이상 500자 이하로 적어주세요.");
        }

        feedbackRepository.save(new BenefitFeedback(request.programId(), type, message));
        return new FeedbackResponse("제보가 접수됐어요.");
    }

    private BenefitFeedback.FeedbackType parseType(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "확인할 항목을 선택해주세요.");
        }
        try {
            return BenefitFeedback.FeedbackType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "올바른 제보 유형이 아닙니다.");
        }
    }

    public record FeedbackRequest(Long programId, String type, String message) {
    }

    public record FeedbackResponse(String message) {
    }
}
