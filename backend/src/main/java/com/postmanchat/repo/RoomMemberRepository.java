package com.postmanchat.repo;

import com.postmanchat.domain.RoomMember;
import com.postmanchat.domain.RoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    boolean existsByIdRoomIdAndIdUserId(UUID roomId, UUID userId);

    List<RoomMember> findByIdRoomId(UUID roomId);

    long countByIdRoomId(UUID roomId);

    Optional<RoomMember> findByIdRoomIdAndIdUserId(UUID roomId, UUID userId);
}
