package com.postmanchat.repo;

import com.postmanchat.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    @Query("""
            SELECT r FROM Room r
            JOIN RoomMember m ON m.id.roomId = r.id
            WHERE m.id.userId = :userId
            ORDER BY r.createdAt DESC
            """)
    List<Room> findRoomsForUser(@Param("userId") UUID userId);

    @Query("""
            SELECT DISTINCT r FROM Room r
            JOIN RoomMember m1 ON m1.id.roomId = r.id
            JOIN RoomMember m2 ON m2.id.roomId = r.id
            WHERE r.type = com.postmanchat.domain.RoomType.direct
              AND m1.id.userId = :firstUserId
              AND m2.id.userId = :secondUserId
            ORDER BY r.createdAt DESC
            """)
    List<Room> findDirectRoomsBetween(@Param("firstUserId") UUID firstUserId, @Param("secondUserId") UUID secondUserId);

    @Query("""
            SELECT COUNT(r) > 0 FROM Room r
            WHERE r.type = com.postmanchat.domain.RoomType.group
              AND LOWER(r.name) = LOWER(:name)
            """)
    boolean existsGroupByNameIgnoreCase(@Param("name") String name);
}
