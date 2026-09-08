package kr.coders.ansimlife.application;

public record ExternalApplicationRequest(
        String idempotencyKey,
        String serviceId,
        String serviceTitle,
        String applicantName,
        String phone,
        String birthYear,
        String district,
        String householdType,
        String incomeRange,
        String memo) {

    static ExternalApplicationRequest from(ApplicationDraft draft, String serviceId, String serviceTitle) {
        return new ExternalApplicationRequest(
                "ansimlife-application-" + draft.getId(),
                serviceId,
                serviceTitle,
                draft.getApplicantName(),
                draft.getPhone(),
                draft.getBirthYear(),
                draft.getDistrict(),
                draft.getHouseholdType(),
                draft.getIncomeRange(),
                draft.getMemo());
    }
}
