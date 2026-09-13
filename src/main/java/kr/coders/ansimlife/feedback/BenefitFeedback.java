package kr.coders.ansimlife.feedback;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "benefit_feedback")
public class BenefitFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long programId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FeedbackType type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected BenefitFeedback() {
    }

    public BenefitFeedback(Long programId, FeedbackType type, String message) {
        this.programId = programId;
        this.type = type;
        this.message = message;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getProgramId() {
        return programId;
    }

    public FeedbackType getType() {
        return type;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public enum FeedbackType {
        OUTDATED,
        WRONG_TARGET,
        WRONG_DEADLINE,
        BROKEN_LINK,
        OTHER
    }
}
