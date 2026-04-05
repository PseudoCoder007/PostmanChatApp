package com.postmanchat.repo;

import com.postmanchat.domain.UserQuest;
import com.postmanchat.domain.UserQuestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserQuestRepository extends JpaRepository<UserQuest, UUID> {

    List<UserQuest> findByUserIdOrderByAssignedAtDesc(UUID userId);

    long countByUserIdAndStatus(UUID userId, UserQuestStatus status);

    boolean existsByUserIdAndTemplateIdAndStatus(UUID userId, UUID templateId, UserQuestStatus status);

    Optional<UserQuest> findByIdAndUserId(UUID id, UUID userId);
}
