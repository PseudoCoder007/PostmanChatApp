package com.postmanchat.repo;

import com.postmanchat.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
            SELECT m FROM Message m
            WHERE m.roomId = :roomId
            AND (:before IS NULL OR m.createdAt < :before)
            ORDER BY m.createdAt DESC
            """)
    List<Message> findPageForRoom(
            @Param("roomId") UUID roomId,
            @Param("before") Instant before,
            Pageable pageable
    );
}
