package kr.coders.ansimlife.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(
        name = "application_drafts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_application_draft_client_program",
                columnNames = {"client_key", "program_id"}))
public class ApplicationDraft {

    public static final List<String> CHECKLIST_IDS = List.of("target", "documents", "period", "route");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_key", nullable = false, length = 80)
    private String codersUser;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(length = 60)
    private String applicantName;

    @Column(length = 30)
    private String phone;

    @Column(length = 4)
    private String birthYear;

    @Column(length = 80)
    private String district;

    @Column(length = 40)
    private String householdType;

    @Column(length = 40)
    private String incomeRange;

    @Column(length = 500)
    private String memo;

    private boolean eligibilityConfirmed;
    private boolean documentsReady;

    // Nullable for drafts created before the individual checklist existed.
    // A legacy completed checklist resolves to all four items when this is null.
    @Column(name = "checklist_mask")
    private Integer checklistMask;
    private boolean termsAccepted;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private int completionPercent;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime submittedAt;

    @Column(length = 50)
    private String submissionProvider;

    @Column(length = 120)
    private String externalReceiptNumber;

    @Column(length = 120)
    private String externalApplicationId;

    @Column(length = 160)
    private String externalAgency;

    // Nullable at the database level so Hibernate can add the column safely to
    // existing installations. The domain getter still exposes PREPARING by default.
    @Column(length = 40)
    private String journeyStatus;

    @Column(length = 120)
    private String userReceiptMemo;

    private LocalDate nextActionDate;

    private LocalDateTime officialSiteOpenedAt;

    private LocalDateTime userReportedSubmittedAt;

    protected ApplicationDraft() {
    }

    public ApplicationDraft(String codersUser, Long programId) {
        this.codersUser = codersUser;
        this.programId = programId;
        this.status = "DRAFT";
        this.journeyStatus = "PREPARING";
    }

    public void update(boolean eligibilityConfirmed, boolean documentsReady) {
        update(eligibilityConfirmed, documentsReady, null);
    }

    public void update(boolean eligibilityConfirmed, boolean documentsReady, List<String> checkedItems) {
        if (isExternallySubmitted()) {
            throw new IllegalStateException("이미 접수한 신청은 수정할 수 없습니다.");
        }
        int newMask = checkedItems == null ? (documentsReady ? 15 : 0) : maskFor(checkedItems);
        // Legacy columns are kept temporarily for schema compatibility, but the
        // navigator no longer collects or retains application personal data.
        this.applicantName = null;
        this.phone = null;
        this.birthYear = null;
        this.district = null;
        this.householdType = null;
        this.incomeRange = null;
        this.memo = null;
        this.eligibilityConfirmed = eligibilityConfirmed;
        this.checklistMask = newMask;
        this.documentsReady = newMask == 15;
        this.termsAccepted = false;
        refreshProgress();
    }

    private void refreshProgress() {
        this.completionPercent = calculatedCompletionPercent();
        this.status = isExternallySubmitted() ? "SUBMITTED" : completionPercent == 100 ? "READY_TO_SUBMIT" : "DRAFT";
    }

    private int calculatedCompletionPercent() {
        return (eligibilityConfirmed ? 1 : 0) * 20 + Integer.bitCount(effectiveChecklistMask()) * 20;
    }

    private int effectiveChecklistMask() {
        return checklistMask == null ? (documentsReady ? 15 : 0) : checklistMask;
    }

    private int maskFor(List<String> checkedItems) {
        Set<String> seen = new HashSet<>();
        int mask = 0;
        for (String item : checkedItems) {
            if (item == null) {
                throw new IllegalArgumentException("준비 항목을 다시 확인해주세요.");
            }
            int index = CHECKLIST_IDS.indexOf(item);
            if (index < 0 || !seen.add(item)) {
                throw new IllegalArgumentException("준비 항목을 다시 확인해주세요.");
            }
            mask |= 1 << index;
        }
        return mask;
    }

    public void requireReadyForExternalSubmission() {
        refreshProgress();
        if (!"READY_TO_SUBMIT".equals(status)) {
            throw new IllegalStateException("지원조건과 준비서류를 모두 확인해주세요.");
        }
    }

    public void completeExternalSubmission(String providerCode, ExternalApplicationReceipt receipt) {
        this.submissionProvider = providerCode;
        this.externalReceiptNumber = receipt.receiptNumber().trim();
        this.externalApplicationId = receipt.externalApplicationId();
        this.externalAgency = receipt.agencyName();
        this.submittedAt = receipt.submittedAt() == null ? LocalDateTime.now() : receipt.submittedAt();
        status = "SUBMITTED";
        journeyStatus = "INSTITUTION_CONFIRMED";
    }

    public void updateJourney(String journeyStatus, String userReceiptMemo, LocalDate nextActionDate) {
        if (journeyStatus == null || !java.util.Set.of(
                "PREPARING",
                "OFFICIAL_SITE_OPENED",
                "USER_REPORTED_SUBMITTED",
                "SUPPLEMENT_REQUESTED",
                "RESULT_WAITING",
                "APPROVED",
                "REJECTED").contains(journeyStatus)) {
            throw new IllegalArgumentException("올바른 진행 상태를 선택해주세요.");
        }
        if (isExternallySubmitted()) {
            throw new IllegalStateException("기관 접수가 확인된 신청은 사용자가 상태를 변경할 수 없습니다.");
        }
        this.journeyStatus = journeyStatus;
        this.userReceiptMemo = userReceiptMemo;
        this.nextActionDate = nextActionDate;
        if ("OFFICIAL_SITE_OPENED".equals(journeyStatus) && officialSiteOpenedAt == null) {
            officialSiteOpenedAt = LocalDateTime.now();
        }
        if ("USER_REPORTED_SUBMITTED".equals(journeyStatus)
                || "SUPPLEMENT_REQUESTED".equals(journeyStatus)
                || "RESULT_WAITING".equals(journeyStatus)
                || "APPROVED".equals(journeyStatus)
                || "REJECTED".equals(journeyStatus)) {
            if (userReportedSubmittedAt == null) userReportedSubmittedAt = LocalDateTime.now();
        }
    }

    public boolean isExternallySubmitted() {
        return externalReceiptNumber != null && !externalReceiptNumber.isBlank();
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (journeyStatus == null || journeyStatus.isBlank()) journeyStatus = "PREPARING";
        refreshProgress();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        refreshProgress();
    }

    public Long getId() { return id; }
    public String getCodersUser() { return codersUser; }
    public Long getProgramId() { return programId; }
    public String getApplicantName() { return applicantName; }
    public String getPhone() { return phone; }
    public String getBirthYear() { return birthYear; }
    public String getDistrict() { return district; }
    public String getHouseholdType() { return householdType; }
    public String getIncomeRange() { return incomeRange; }
    public String getMemo() { return memo; }
    public boolean isEligibilityConfirmed() { return eligibilityConfirmed; }
    public boolean isDocumentsReady() { return effectiveChecklistMask() == 15; }
    public List<String> getCheckedItems() {
        int mask = effectiveChecklistMask();
        List<String> checked = new ArrayList<>(CHECKLIST_IDS.size());
        for (int index = 0; index < CHECKLIST_IDS.size(); index++) {
            if ((mask & (1 << index)) != 0) checked.add(CHECKLIST_IDS.get(index));
        }
        return List.copyOf(checked);
    }
    public boolean isTermsAccepted() { return termsAccepted; }
    public String getStatus() {
        if ("SUBMITTED".equals(status) && !isExternallySubmitted()) {
            return calculatedCompletionPercent() == 100 ? "READY_TO_SUBMIT" : "DRAFT";
        }
        return isExternallySubmitted() ? "SUBMITTED" : calculatedCompletionPercent() == 100 ? "READY_TO_SUBMIT" : "DRAFT";
    }
    public int getCompletionPercent() { return calculatedCompletionPercent(); }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getSubmittedAt() { return isExternallySubmitted() ? submittedAt : null; }
    public String getSubmissionProvider() { return submissionProvider; }
    public String getExternalReceiptNumber() { return externalReceiptNumber; }
    public String getExternalApplicationId() { return externalApplicationId; }
    public String getExternalAgency() { return externalAgency; }
    public String getJourneyStatus() {
        if (isExternallySubmitted()) return "INSTITUTION_CONFIRMED";
        return journeyStatus == null || journeyStatus.isBlank() ? "PREPARING" : journeyStatus;
    }
    public String getUserReceiptMemo() { return userReceiptMemo; }
    public LocalDate getNextActionDate() { return nextActionDate; }
    public LocalDateTime getOfficialSiteOpenedAt() { return officialSiteOpenedAt; }
    public LocalDateTime getUserReportedSubmittedAt() { return userReportedSubmittedAt; }
}
