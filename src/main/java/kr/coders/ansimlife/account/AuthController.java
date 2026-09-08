package kr.coders.ansimlife.account;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public static final String SESSION_USER_ID = "ansimlife.userId";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public SessionResponse me(HttpSession session) {
        Long userId = sessionUserId(session);
        if (userId == null) return SessionResponse.anonymous();
        return repository.findById(userId)
                .map(SessionResponse::authenticated)
                .orElseGet(() -> {
                    session.invalidate();
                    return SessionResponse.anonymous();
                });
    }

    @PostMapping("/register")
    @Transactional
    public SessionResponse register(@RequestBody RegisterRequest body,
                                    HttpServletRequest request) {
        String email = normalizeEmail(body == null ? null : body.email());
        String password = requirePassword(body == null ? null : body.password());
        String displayName = requireDisplayName(body == null ? null : body.displayName());
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일이에요.");
        }
        UserAccount account = repository.save(new UserAccount(email, passwordEncoder.encode(password), displayName));
        establishSession(request, account.getId());
        return SessionResponse.authenticated(account);
    }

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public SessionResponse login(@RequestBody LoginRequest body,
                                 HttpServletRequest request) {
        String email = normalizeEmail(body == null ? null : body.email());
        String password = body == null ? "" : String.valueOf(body.password());
        UserAccount account = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인해주세요."));
        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인해주세요.");
        }
        establishSession(request, account.getId());
        return SessionResponse.authenticated(account);
    }

    @PostMapping("/logout")
    public SessionResponse logout(HttpSession session) {
        session.invalidate();
        return SessionResponse.anonymous();
    }

    private void establishSession(HttpServletRequest request, Long userId) {
        HttpSession existing = request.getSession(false);
        if (existing != null) existing.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute(SESSION_USER_ID, userId);
    }

    public static Long sessionUserId(HttpSession session) {
        Object value = session.getAttribute(SESSION_USER_ID);
        return value instanceof Long id ? id : null;
    }

    public static Long requireSessionUserId(HttpSession session) {
        Long userId = sessionUserId(session);
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        return userId;
    }

    private String normalizeEmail(String value) {
        String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 160 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 이메일을 입력해주세요.");
        }
        return email;
    }

    private String requirePassword(String value) {
        if (value == null || value.length() < 8 || value.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8~72자로 입력해주세요.");
        }
        return value;
    }

    private String requireDisplayName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.length() < 2 || name.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 2~30자로 입력해주세요.");
        }
        return name;
    }

    public record RegisterRequest(String email, String password, String displayName) {}
    public record LoginRequest(String email, String password) {}
    public record SessionResponse(boolean authenticated, Long id, String email, String displayName) {
        static SessionResponse anonymous() { return new SessionResponse(false, null, null, null); }
        static SessionResponse authenticated(UserAccount account) {
            return new SessionResponse(true, account.getId(), account.getEmail(), account.getDisplayName());
        }
    }
}
