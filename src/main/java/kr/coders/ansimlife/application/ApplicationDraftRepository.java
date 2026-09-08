package kr.coders.ansimlife.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationDraftRepository extends JpaRepository<ApplicationDraft, Long> {
    Optional<ApplicationDraft> findByCodersUserAndProgramId(String codersUser, Long programId);
    List<ApplicationDraft> findAllByCodersUserOrderByUpdatedAtDesc(String codersUser);
}
