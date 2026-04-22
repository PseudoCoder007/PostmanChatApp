package com.postmanchat.repo;

import com.postmanchat.domain.Friendship;
import com.postmanchat.domain.FriendshipId;
import com.postmanchat.domain.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, FriendshipId> {

    @Query("""
            SELECT f FROM Friendship f
            WHERE f.id.userLowId = :userId OR f.id.userHighId = :userId
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findForUser(@Param("userId") UUID userId);

    @Query("""
            SELECT COUNT(f) > 0 FROM Friendship f
            WHERE f.id.userLowId = :userLowId
              AND f.id.userHighId = :userHighId
              AND f.status = :status
            """)
    boolean existsByUsersAndStatus(
            @Param("userLowId") UUID userLowId,
            @Param("userHighId") UUID userHighId,
            @Param("status") FriendshipStatus status
    );

    @Query("""
            SELECT CASE WHEN f.id.userLowId = :userId THEN f.id.userHighId ELSE f.id.userLowId END
            FROM Friendship f
            WHERE (f.id.userLowId = :userId OR f.id.userHighId = :userId)
              AND f.status = :status
            """)
    List<UUID> findAcceptedFriendIds(@Param("userId") UUID userId, @Param("status") FriendshipStatus status);
}
