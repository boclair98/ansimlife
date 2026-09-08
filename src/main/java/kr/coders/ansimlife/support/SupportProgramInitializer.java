package kr.coders.ansimlife.support;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SupportProgramInitializer {

    @Bean
    CommandLineRunner seedPrograms(SupportProgramRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                repository.findAll().stream()
                        .filter(program -> program.getExternalId() == null)
                        .forEach(program -> {
                            String category = switch (program.getCategory()) {
                                case "주거" -> "주거·자립";
                                case "안전" -> "행정·안전";
                                case "생활" -> "생활안정";
                                case "관계" -> "문화·환경";
                                default -> program.getCategory();
                            };
                            program.sync(program.getTitle(), program.getRegion(), category, program.getTarget(),
                                    program.getSummary(), program.getBenefit(), program.getApplyUrl(),
                                    program.getDeadline(), program.isUrgent());
                            repository.save(program);
                        });
                return;
            }

            repository.save(new SupportProgram(
                    "1인가구 전월세 안심계약 도움서비스", "서울", "주거·자립",
                    "서울 거주 또는 거주 예정 1인가구",
                    "계약서 확인부터 집보기 현장동행까지 주거안심매니저와 함께 준비해요.",
                    "계약상담 · 집보기 동행 · 주거지 탐색",
                    "https://1in.seoul.go.kr", "상시", true));
            repository.save(new SupportProgram(
                    "안심이 앱 귀가 모니터링", "서울", "행정·안전",
                    "서울 시민 누구나",
                    "귀가 시작과 도착을 공유하고 위급 상황에는 긴급신고를 연결해요.",
                    "귀가 모니터링 · 긴급신고 · 안심귀가택시",
                    "https://safe.seoul.go.kr", "상시", true));
            repository.save(new SupportProgram(
                    "정부24 나의 생활정보 알림", "전국", "생활안정",
                    "정부24 이용자",
                    "여권 만료, 자동차 검사, 주택·복지 관련 생활정보를 한 곳에서 확인해요.",
                    "생활정보 조회 · 사전알림",
                    "https://www.gov.kr/mw/AA210LifeSvcInfo.do", "상시", false));
            repository.save(new SupportProgram(
                    "청년월세 한시 특별지원 확인", "전국", "주거·자립",
                    "청년 1인가구 등 요건 충족자",
                    "내가 받을 수 있는 주거지원이 있는지 복지로에서 먼저 확인해요.",
                    "월세 지원 여부 확인 · 온라인 신청",
                    "https://www.bokjiro.go.kr", "공고별 상이", false));
            repository.save(new SupportProgram(
                    "지역 1인가구 지원센터 프로그램", "전국", "문화·환경",
                    "지역별 1인가구",
                    "요리·건강·상담·관계망 프로그램을 지역별로 찾아볼 수 있어요.",
                    "지역 프로그램 · 상담 · 커뮤니티",
                    "https://1in.seoul.go.kr/front/bsns/bsnsList.do", "지역별 상이", false));
        };
    }
}
