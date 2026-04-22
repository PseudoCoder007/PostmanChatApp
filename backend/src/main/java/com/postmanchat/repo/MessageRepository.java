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
            ORDER BY m.createdAt DESC
            """)
    List<Message> findPageForRoom(
            @Param("roomId") UUID roomId,
            Pageable pageable
    );

    @Query("""
            SELECT m FROM Message m
            WHERE m.roomId = :roomId
            AND m.createdAt < :before
            ORDER BY m.createdAt DESC
            """)
    List<Message> findPageForRoomBefore(
            @Param("roomId") UUID roomId,
            @Param("before") Instant before,
            Pageable pageable
    );

    @Query("""
            SELECT m FROM Message m
            WHERE m.roomId = :roomId
            AND lower(m.content) LIKE lower(concat('%', :q, '%'))
            ORDER BY m.createdAt DESC
            """)
    List<Message> searchInRoom(
            @Param("roomId") UUID roomId,
            @Param("q") String q,
            Pageable pageable
    );

    @Query(value = "SELECT room_id AS roomId, MAX(created_at) AS lastAt FROM messages WHERE room_id IN (:roomIds) GROUP BY room_id", nativeQuery = true)
    List<RoomLastMessage> findLastMessageAtForRooms(@Param("roomIds") List<UUID> roomIds);

    @Query(value = """
            SELECT CAST(created_at AS DATE) FROM messages
            WHERE room_id = :roomId
              AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY CAST(created_at AS DATE)
            ORDER BY CAST(created_at AS DATE) DESC
            """, nativeQuery = true)
    List<java.sql.Date> findDistinctMessageDatesLastWeek(@Param("roomId") UUID roomId);
}
