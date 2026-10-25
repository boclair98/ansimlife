package kr.coders.ansimlife.account;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock UserAccountRepository repository;
    @Mock PasswordEncoder passwordEncoder;

    @Test
    void anonymousSessionLookupDoesNotCreateSession() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        AuthController.SessionResponse response = new AuthController(repository, passwordEncoder).me(request);

        assertThat(response.authenticated()).isFalse();
        assertThat(request.getSession(false)).isNull();
    }

    @Test
    void concurrentRegistrationConflictHasUsefulResponse() {
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(repository.saveAndFlush(any(UserAccount.class)))
                .thenThrow(new DataIntegrityViolationException("unique email constraint"));

        assertThatThrownBy(() -> new AuthController(repository, passwordEncoder).register(
                new AuthController.RegisterRequest("new@example.com", "password123", "새 사용자"),
                new MockHttpServletRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("이미 가입된 이메일");
    }
}
