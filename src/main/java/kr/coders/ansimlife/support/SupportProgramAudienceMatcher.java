package kr.coders.ansimlife.support;

import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SupportProgramAudienceMatcher {

    private static final Pattern AGE_RANGE = Pattern.compile(
            "(?<!\\d)(?:만\\s*)?(\\d{1,3})\\s*세?\\s*(?:~|∼|～|[-–—]|부터)\\s*(?:만\\s*)?(\\d{1,3})\\s*세");
    private static final Pattern AGE_BOUND = Pattern.compile(
            "(?<!\\d)(?:만\\s*)?(\\d{1,3})\\s*세\\s*(이상|이하|미만|초과)");

    private static final String[] TEEN_TERMS = {
            "청소년", "아동", "영유아", "미성년", "초등학생", "중학생", "고등학생", "학교 밖 청소년", "소년소녀가정"
    };
    private static final String[] YOUTH_TERMS = {
            "청년", "대학생", "대학원생", "취업준비생", "사회초년생", "자립준비", "보호종료아동"
    };
    private static final String[] MIDDLE_AGE_TERMS = {
            "중장년", "중년", "장년", "신중년", "40대", "50대"
    };
    private static final String[] SENIOR_TERMS = {
            "노인", "어르신", "고령", "시니어", "독거노인", "기초연금", "노후연금", "주택연금"
    };
    private static final String[] UNIVERSAL_AGE_TERMS = {
            "연령 무관", "연령 제한 없음", "나이 제한 없음", "전 국민", "모든 국민"
    };
    private static final String[] ADULT_GENERAL_TERMS = {
            "성년", "일반공급", "공통사항", "무주택세대구성원", "무주택 세대 구성원"
    };

    private static final String[] SINGLE_HOUSEHOLD_TERMS = {
            "1인가구", "1인 가구", "독거", "단독세대주", "단독 세대주"
    };
    private static final String[] CHILD_HOUSEHOLD_TERMS = {
            "자녀가 있는", "자녀 있음", "다자녀", "한부모가족", "한부모 가족", "양육가구", "양육 가구", "출산가구", "출산 가구"
    };
    private static final String[] CARE_HOUSEHOLD_TERMS = {
            "가족돌봄", "가족 돌봄", "돌봄가족", "돌봄 가족", "간병가족", "간병 가족", "부양가족", "부양 가족"
    };
    private static final String[] OTHER_HOUSEHOLD_TERMS = {
            "신혼부부", "신혼가구", "신혼 가구", "다문화가족", "다문화 가족"
    };

    public boolean supportsAgeGroup(String ageGroup) {
        return isBlank(ageGroup) || AgeBand.from(ageGroup) != null;
    }

    public boolean supportsHousehold(String household) {
        return isBlank(household) || Household.from(household) != null;
    }

    public boolean matches(SupportProgram program, String ageGroup, String household) {
        String audienceText = normalize(program.getTitle() + " " + program.getTarget());
        return matchesAge(audienceText, ageGroup) && matchesHousehold(audienceText, household);
    }

    boolean matches(String title, String target, String ageGroup, String household) {
        return matchesAge(normalize(title + " " + target), ageGroup)
                && matchesHousehold(normalize(title + " " + target), household);
    }

    private boolean matchesAge(String text, String ageGroup) {
        if (isBlank(ageGroup)) return true;
        AgeBand selected = AgeBand.from(ageGroup);
        if (selected == null) return false;
        if (containsAny(text, UNIVERSAL_AGE_TERMS)) return true;

        Set<AgeBand> detected = EnumSet.noneOf(AgeBand.class);
        addWhenPresent(detected, AgeBand.TEEN, text, TEEN_TERMS);
        addWhenPresent(detected, AgeBand.YOUTH, text, YOUTH_TERMS);
        addWhenPresent(detected, AgeBand.MIDDLE_AGE, text, MIDDLE_AGE_TERMS);
        addWhenPresent(detected, AgeBand.SENIOR, text, SENIOR_TERMS);

        if (containsAny(text, ADULT_GENERAL_TERMS)) {
            detected.add(AgeBand.YOUTH);
            detected.add(AgeBand.MIDDLE_AGE);
            detected.add(AgeBand.SENIOR);
        }

        addNumericAgeBands(detected, text);
        return detected.isEmpty() || detected.contains(selected);
    }

    private boolean matchesHousehold(String text, String household) {
        if (isBlank(household)) return true;
        Household selected = Household.from(household);
        if (selected == null) return false;

        Set<Household> detected = EnumSet.noneOf(Household.class);
        addWhenPresent(detected, Household.SINGLE, text, SINGLE_HOUSEHOLD_TERMS);
        addWhenPresent(detected, Household.WITH_CHILDREN, text, CHILD_HOUSEHOLD_TERMS);
        addWhenPresent(detected, Household.CAREGIVING, text, CARE_HOUSEHOLD_TERMS);
        addWhenPresent(detected, Household.OTHER, text, OTHER_HOUSEHOLD_TERMS);

        if (detected.isEmpty()) return true;
        return detected.contains(selected);
    }

    private void addNumericAgeBands(Set<AgeBand> detected, String text) {
        Matcher ranges = AGE_RANGE.matcher(text);
        while (ranges.find()) {
            int first = Integer.parseInt(ranges.group(1));
            int second = Integer.parseInt(ranges.group(2));
            addIntersecting(detected, Math.min(first, second), Math.max(first, second));
        }

        Matcher bounds = AGE_BOUND.matcher(text);
        while (bounds.find()) {
            int age = Integer.parseInt(bounds.group(1));
            int namedMinimum = detected.stream().mapToInt(value -> value.minimum).min().orElse(0);
            int namedMaximum = detected.stream().mapToInt(value -> value.maximum).max().orElse(120);
            switch (bounds.group(2)) {
                case "이상" -> addIntersecting(detected, age, namedMaximum);
                case "초과" -> addIntersecting(detected, age + 1, namedMaximum);
                case "이하" -> addIntersecting(detected, namedMinimum, age);
                case "미만" -> addIntersecting(detected, namedMinimum, Math.max(namedMinimum, age - 1));
                default -> { }
            }
        }
    }

    private void addIntersecting(Set<AgeBand> detected, int minimum, int maximum) {
        for (AgeBand band : AgeBand.values()) {
            if (minimum <= band.maximum && maximum >= band.minimum) detected.add(band);
        }
    }

    private <T extends Enum<T>> void addWhenPresent(Set<T> detected, T value, String text, String[] terms) {
        if (containsAny(text, terms)) detected.add(value);
    }

    private boolean containsAny(String text, String[] terms) {
        String compact = text.replace(" ", "");
        for (String term : terms) {
            String normalizedTerm = normalize(term);
            if (text.contains(normalizedTerm) || compact.contains(normalizedTerm.replace(" ", ""))) return true;
        }
        return false;
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private enum AgeBand {
        TEEN("청소년", 0, 18),
        YOUTH("청년", 19, 39),
        MIDDLE_AGE("중장년", 40, 64),
        SENIOR("노인", 65, 120);

        private final String value;
        private final int minimum;
        private final int maximum;

        AgeBand(String value, int minimum, int maximum) {
            this.value = value;
            this.minimum = minimum;
            this.maximum = maximum;
        }

        private static AgeBand from(String value) {
            if (value == null) return null;
            for (AgeBand band : values()) if (band.value.equals(value.trim())) return band;
            return null;
        }
    }

    private enum Household {
        SINGLE("1인 가구"),
        WITH_CHILDREN("자녀가 있는 가구"),
        CAREGIVING("가족 돌봄 중"),
        OTHER("그 외 가구");

        private final String value;

        Household(String value) {
            this.value = value;
        }

        private static Household from(String value) {
            if (value == null) return null;
            for (Household household : values()) if (household.value.equals(value.trim())) return household;
            return null;
        }
    }
}
