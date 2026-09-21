package kr.coders.ansimlife.support;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Public-data deadline text is not a single date field.  Keep its presentation
 * rules in one place so the API and browser do not disagree about freshness.
 */
public final class BenefitDeadline {

    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private static final Pattern FULL_DATE = Pattern.compile(
            "(20\\d{2})\\s*[./-]\\s*(\\d{1,2})\\s*[./-]\\s*(\\d{1,2})");
    private static final Pattern MONTH_DAY = Pattern.compile(
            "(?<!\\d)(\\d{1,2})\\s*[./-]\\s*(\\d{1,2})(?!\\s*[./-]\\s*\\d)");

    private BenefitDeadline() {
    }

    public static Info analyze(String raw) {
        String text = raw == null ? "" : raw.trim();
        if (text.isBlank() || text.equals("-") || text.contains("기관 공고 확인")
                || text.contains("접수기관 별 상이") || text.contains("모집공고 확인")) {
            return new Info("UNKNOWN", "모집기간 확인 필요", false, false, null);
        }
        if (text.matches(".*(상시|수시|연중|언제든).*")) {
            return new Info("OPEN", "상시 신청", false, false, null);
        }
        if (text.contains("별도의 신청절차가 없음") || text.contains("신청절차 없음")) {
            return new Info("OPEN", "별도 신청 없음", false, false, null);
        }

        List<LocalDate> dates = extractDates(text);
        if (dates.isEmpty()) {
            return new Info("UNKNOWN", "모집기간 확인 필요", false, false, null);
        }

        LocalDate today = LocalDate.now(KOREA);
        LocalDate last = dates.stream().max(LocalDate::compareTo).orElse(null);
        if (last.isBefore(today)) {
            return new Info("EXPIRED", "모집 종료", true, false, last);
        }

        long days = ChronoUnit.DAYS.between(today, last);
        boolean urgent = days >= 0 && days <= 30;
        String label = urgent ? "마감 임박 · " + days + "일 남음" : "마감 " + last;
        return new Info(urgent ? "URGENT" : "OPEN", label, false, urgent, last);
    }

    private static List<LocalDate> extractDates(String text) {
        List<LocalDate> dates = new ArrayList<>();
        Matcher full = FULL_DATE.matcher(text);
        while (full.find()) {
            add(dates, Integer.parseInt(full.group(1)), Integer.parseInt(full.group(2)), Integer.parseInt(full.group(3)));
        }

        int anchorYear = dates.isEmpty() ? LocalDate.now(KOREA).getYear() : dates.get(0).getYear();
        Matcher partial = MONTH_DAY.matcher(text);
        while (partial.find()) {
            int month = Integer.parseInt(partial.group(1));
            int day = Integer.parseInt(partial.group(2));
            if (month <= 12) add(dates, anchorYear, month, day);
        }
        return dates;
    }

    private static void add(List<LocalDate> dates, int year, int month, int day) {
        try {
            dates.add(LocalDate.of(year, month, day));
        } catch (RuntimeException ignored) {
            // A malformed public-data date should become "확인 필요", not break the list.
        }
    }

    public record Info(String status, String label, boolean expired, boolean urgent, LocalDate lastDate) {
    }
}
