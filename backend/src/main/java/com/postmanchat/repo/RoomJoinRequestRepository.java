package com.postmanchat.repo;

import com.postmanchat.domain.RoomJoinRequest;
import com.postmanchat.domain.RoomJoinRequestId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomJoinRequestRepository extends JpaRepository<RoomJoinRequest, RoomJoinRequestId> {

    List<RoomJoinRequest> findByIdRoomIdAndStatusOrderByCreatedAtAsc(UUID roomId, String status);

    Optional<RoomJoinRequest> findByIdRoomIdAndIdUserId(UUID roomId, UUID userId);
}
