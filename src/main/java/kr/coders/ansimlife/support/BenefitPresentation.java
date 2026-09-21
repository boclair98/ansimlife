package kr.coders.ansimlife.support;

import java.util.LinkedHashMap;
import java.util.Map;

/** Presentation-level corrections for noisy public-data labels. */
public final class BenefitPresentation {

    private static final Map<String, String> REGION_HINTS = new LinkedHashMap<>();
    private static final Map<String, String> CATEGORY_HINTS = new LinkedHashMap<>();

    static {
        REGION_HINTS.put("서울", "서울");
        REGION_HINTS.put("부산", "부산");
        REGION_HINTS.put("대구", "대구");
        REGION_HINTS.put("인천", "인천");
        REGION_HINTS.put("광주", "광주");
        REGION_HINTS.put("대전", "대전");
        REGION_HINTS.put("울산", "울산");
        REGION_HINTS.put("세종", "세종");
        REGION_HINTS.put("경기", "경기");
        REGION_HINTS.put("강원", "강원");
        REGION_HINTS.put("충북", "충북");
        REGION_HINTS.put("충청북", "충북");
        REGION_HINTS.put("충남", "충남");
        REGION_HINTS.put("충청남", "충남");
        REGION_HINTS.put("전북", "전북");
        REGION_HINTS.put("전라북", "전북");
        REGION_HINTS.put("전남", "전남");
        REGION_HINTS.put("전라남", "전남");
        REGION_HINTS.put("경북", "경북");
        REGION_HINTS.put("경상북", "경북");
        REGION_HINTS.put("경남", "경남");
        REGION_HINTS.put("경상남", "경남");
        REGION_HINTS.put("제주", "제주");
        REGION_HINTS.put("천안", "충남");
        REGION_HINTS.put("전주", "전북");
        REGION_HINTS.put("익산", "전북");
        REGION_HINTS.put("군산", "전북");
        REGION_HINTS.put("청주", "충북");
        REGION_HINTS.put("춘천", "강원");
        REGION_HINTS.put("원주", "강원");
        REGION_HINTS.put("제주시", "제주");

        CATEGORY_HINTS.put("임신", "임신·출산");
        CATEGORY_HINTS.put("출산", "임신·출산");
        CATEGORY_HINTS.put("돌봄", "보호·돌봄");
        CATEGORY_HINTS.put("치매", "보건·의료");
        CATEGORY_HINTS.put("의료", "보건·의료");
        CATEGORY_HINTS.put("진료", "보건·의료");
        CATEGORY_HINTS.put("건강", "보건·의료");
        CATEGORY_HINTS.put("월세", "주거·자립");
        CATEGORY_HINTS.put("전세", "주거·자립");
        CATEGORY_HINTS.put("주택", "주거·자립");
        CATEGORY_HINTS.put("임대", "주거·자립");
        CATEGORY_HINTS.put("이사", "주거·자립");
        CATEGORY_HINTS.put("취업", "고용·창업");
        CATEGORY_HINTS.put("창업", "고용·창업");
        CATEGORY_HINTS.put("일자리", "고용·창업");
        CATEGORY_HINTS.put("고용", "고용·창업");
        CATEGORY_HINTS.put("인턴", "고용·창업");
        CATEGORY_HINTS.put("학자금", "보육·교육");
        CATEGORY_HINTS.put("장학", "보육·교육");
        CATEGORY_HINTS.put("교육", "보육·교육");
        CATEGORY_HINTS.put("보육", "보육·교육");
        CATEGORY_HINTS.put("예술", "문화·환경");
        CATEGORY_HINTS.put("문화", "문화·환경");
        CATEGORY_HINTS.put("농업", "농림축산어업");
        CATEGORY_HINTS.put("어업", "농림축산어업");
        CATEGORY_HINTS.put("축산", "농림축산어업");
        CATEGORY_HINTS.put("재난", "행정·안전");
        CATEGORY_HINTS.put("응급", "행정·안전");
        CATEGORY_HINTS.put("안전", "행정·안전");
    }

    private BenefitPresentation() {
    }

    public static String region(String storedRegion, String title) {
        String safeTitle = title == null ? "" : title;
        if (storedRegion != null && !storedRegion.isBlank() && !storedRegion.equals("전국")) {
            return storedRegion;
        }
        for (Map.Entry<String, String> entry : REGION_HINTS.entrySet()) {
            if (safeTitle.contains(entry.getKey())) return entry.getValue();
        }
        return storedRegion == null || storedRegion.isBlank() ? "전국" : storedRegion;
    }

    public static String category(String storedCategory, String title) {
        String safeTitle = (title == null ? "" : title).replace(" ", "");
        for (Map.Entry<String, String> entry : CATEGORY_HINTS.entrySet()) {
            if (safeTitle.contains(entry.getKey())) return entry.getValue();
        }
        return storedCategory == null || storedCategory.isBlank() ? "생활안정" : storedCategory;
    }
}
