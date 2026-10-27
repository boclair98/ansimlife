package kr.coders.ansimlife.support;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Editorial search groups, never an eligibility decision. */
final class BenefitTopic {
    private static final Map<String, List<String>> TERMS = Map.of(
            "housing", List.of("이사", "월세", "전세", "보증금", "주거", "임차", "임대"),
            "work", List.of("취업", "구직", "일자리", "창업", "고용"),
            "family", List.of("임신", "출산", "육아", "보육", "아동", "부모급여"),
            "learn", List.of("장학", "학자금", "교육", "학습", "입학"),
            "care", List.of("의료", "건강", "돌봄", "요양", "진료"),
            "culture", List.of("문화", "예술", "여가", "체육", "스포츠"));

    private BenefitTopic() {}

    static boolean supports(String topic) { return topic.isEmpty() || TERMS.containsKey(topic); }

    static boolean matches(SupportProgram program, String topic) {
        if (topic.isEmpty()) return true;
        String content = Stream.of(program.getTitle(), program.getSummary(), program.getTarget(), program.getBenefit())
                .filter(Objects::nonNull).collect(Collectors.joining(" ")).toLowerCase(Locale.ROOT);
        return TERMS.getOrDefault(topic, List.of()).stream().anyMatch(content::contains);
    }
}
