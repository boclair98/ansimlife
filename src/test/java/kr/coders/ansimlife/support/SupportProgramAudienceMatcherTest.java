package kr.coders.ansimlife.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SupportProgramAudienceMatcherTest {

    private final SupportProgramAudienceMatcher matcher = new SupportProgramAudienceMatcher();

    @Test
    void youthNeverReceivesSeniorOnlyBenefit() {
        assertThat(matcher.matches(
                "주택담보 노후연금 보증 지원",
                "부부 중 1인 만 55세 이상 또는 기초연금 수급자",
                "청년", "그 외 가구"))
                .isFalse();
        assertThat(matcher.matches(
                "노인 문화이용 지원",
                "만 65세 이상 노인이면 누구나",
                "청년", "그 외 가구"))
                .isFalse();
    }

    @Test
    void youthReceivesYouthAndNumericYouthBenefits() {
        assertThat(matcher.matches(
                "서울시 청년 월세 지원",
                "서울 월세 거주 19세 ~ 39세 이하 청년 1인 가구",
                "청년", "1인 가구"))
                .isTrue();
        assertThat(matcher.matches(
                "주거 지원",
                "만 19~39세 무주택자",
                "청년", "그 외 가구"))
                .isTrue();
    }

    @Test
    void mixedAudienceBenefitIsKeptForEveryNamedAudience() {
        String target = "대학생, 청년, 신혼부부, 한부모가족, 고령자, 주거급여수급자";
        assertThat(matcher.matches("행복주택 공급", target, "청년", "그 외 가구")).isTrue();
        assertThat(matcher.matches("행복주택 공급", target, "노인", "그 외 가구")).isTrue();
    }

    @Test
    void generalAdultBenefitMatchesYouthButNotTeenager() {
        String target = "만 19세 이상 성년 등록장애인";
        assertThat(matcher.matches("자립자금 대여", target, "청년", "그 외 가구")).isTrue();
        assertThat(matcher.matches("자립자금 대여", target, "청소년", "그 외 가구")).isFalse();
    }

    @Test
    void householdChoiceExcludesContradictingExclusiveBenefit() {
        assertThat(matcher.matches(
                "청년 월세 지원", "19~39세 청년 1인 가구", "청년", "자녀가 있는 가구"))
                .isFalse();
        assertThat(matcher.matches(
                "다자녀 주거비 지원", "만 39세 이하 자녀가 있는 가구", "청년", "1인 가구"))
                .isFalse();
    }

    @Test
    void benefitWithoutAgeOrHouseholdRestrictionRemainsAvailable() {
        assertThat(matcher.matches(
                "저소득층 에너지효율 개선", "기준중위소득 60% 이하 가구", "청년", "1인 가구"))
                .isTrue();
    }
}
