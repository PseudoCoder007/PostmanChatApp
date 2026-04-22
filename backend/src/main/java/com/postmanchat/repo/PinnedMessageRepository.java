package com.postmanchat.repo;

import com.postmanchat.domain.PinnedMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PinnedMessageRepository extends JpaRepository<PinnedMessage, UUID> {

    List<PinnedMessage> findByRoomIdOrderByPinnedAtDesc(UUID roomId);

    Optional<PinnedMessage> findByRoomIdAndMessageId(UUID roomId, UUID messageId);

    long countByRoomId(UUID roomId);
}
