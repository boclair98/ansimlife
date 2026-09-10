package kr.coders.ansimlife.account;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Set;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private static final Set<String> REGIONS = Set.of(
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주");
    private static final Set<String> AGE_GROUPS = Set.of("청소년", "청년", "중장년", "노인");
    private static final Set<String> HOUSEHOLDS = Set.of("1인 가구", "자녀가 있는 가구", "가족 돌봄 중", "그 외 가구");
    private static final Set<String> NEEDS = Set.of(
            "생활안정", "주거·자립", "보육·교육", "고용·창업", "보건·의료",
            "행정·안전", "임신·출산", "보호·돌봄", "문화·환경", "농림축산어업");

    private final UserProfileRepository repository;

    public UserProfileController(UserProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ProfileResponse get(HttpSession session) {
        Long userId = AuthController.requireSessionUserId(session);
        return repository.findByUserId(userId)
                .map(ProfileResponse::from)
                .orElseGet(ProfileResponse::empty);
    }

    @PutMapping
    @Transactional
    public ProfileResponse save(@RequestBody ProfileRequest request, HttpSession session) {
        Long userId = AuthController.requireSessionUserId(session);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "맞춤 조건을 입력해주세요.");
        }
        String region = required(request.region(), REGIONS, "거주 지역");
        String ageGroup = required(request.ageGroup(), AGE_GROUPS, "연령대");
        String household = required(request.household(), HOUSEHOLDS, "가구 상황");
        String need = required(request.need(), NEEDS, "관심 분야");
        String incomeRange = optional(request.incomeRange(), 40, "소득 구간");

        UserProfile profile = repository.findByUserId(userId)
                .orElseGet(() -> new UserProfile(userId, region, ageGroup, household, need, incomeRange));
        profile.update(region, ageGroup, household, need, incomeRange);
        return ProfileResponse.from(repository.saveAndFlush(profile));
    }

    @DeleteMapping
    @Transactional
    public void delete(HttpSession session) {
        Long userId = AuthController.requireSessionUserId(session);
        repository.findByUserId(userId).ifPresent(repository::delete);
    }

    private String required(String value, Set<String> allowed, String label) {
        String normalized = value == null ? "" : value.trim();
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + "을 올바르게 선택해주세요.");
        }
        return normalized;
    }

    private String optional(String value, int maxLength, String label) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " 입력값이 너무 깁니다.");
        }
        return normalized.isBlank() ? null : normalized;
    }

    public record ProfileRequest(String region, String ageGroup, String household,
                                 String need, String incomeRange) {
    }

    public record ProfileResponse(boolean exists, String region, String ageGroup,
                                   String household, String need, String incomeRange,
                                   LocalDateTime updatedAt) {
        static ProfileResponse empty() {
            return new ProfileResponse(false, null, null, null, null, null, null);
        }

        static ProfileResponse from(UserProfile profile) {
            return new ProfileResponse(true, profile.getRegion(), profile.getAgeGroup(),
                    profile.getHousehold(), profile.getNeed(), profile.getIncomeRange(), profile.getUpdatedAt());
        }
    }
}
