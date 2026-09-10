package kr.coders.ansimlife.account;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileControllerTest {

    @Mock
    private UserProfileRepository repository;

    @Test
    void authenticatedUserCanSaveAndReadCoarseMatchingProfile() {
        UserProfileController controller = new UserProfileController(repository);
        MockHttpSession session = sessionFor(7L);
        when(repository.findByUserId(7L)).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(UserProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileController.ProfileResponse saved = controller.save(
                new UserProfileController.ProfileRequest(
                        "서울", "청년", "1인 가구", "주거·자립", "기준중위소득 50~100%"),
                session);

        assertThat(saved.exists()).isTrue();
        assertThat(saved.ageGroup()).isEqualTo("청년");
        assertThat(saved.need()).isEqualTo("주거·자립");

        UserProfile profile = new UserProfile(
                7L, "서울", "청년", "1인 가구", "주거·자립", "기준중위소득 50~100%");
        when(repository.findByUserId(7L)).thenReturn(Optional.of(profile));
        UserProfileController.ProfileResponse loaded = controller.get(session);

        assertThat(loaded.region()).isEqualTo("서울");
        assertThat(loaded.household()).isEqualTo("1인 가구");
    }

    @Test
    void profileRejectsUnknownAudienceValues() {
        UserProfileController controller = new UserProfileController(repository);

        assertThatThrownBy(() -> controller.save(
                new UserProfileController.ProfileRequest(
                        "서울", "노인 아님", "1인 가구", "주거·자립", ""),
                sessionFor(7L)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("연령대");
    }

    private MockHttpSession sessionFor(Long userId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthController.SESSION_USER_ID, userId);
        return session;
    }
}
