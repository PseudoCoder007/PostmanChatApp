package com.postmanchat.service;

import com.postmanchat.domain.Room;
import com.postmanchat.domain.RoomJoinRequest;
import com.postmanchat.domain.RoomJoinRequestId;
import com.postmanchat.domain.RoomMember;
import com.postmanchat.domain.RoomMemberId;
import com.postmanchat.domain.RoomType;
import com.postmanchat.domain.RoomVisibility;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.repo.RoomJoinRequestRepository;
import com.postmanchat.repo.RoomMemberRepository;
import com.postmanchat.repo.RoomRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.CreateRoomRequest;
import com.postmanchat.web.dto.ProfileDto;
import com.postmanchat.web.dto.RoomJoinRequestDto;
import com.postmanchat.web.dto.RoomDto;
import com.postmanchat.web.dto.RoomReadEventDto;
import com.postmanchat.web.dto.WsMessagePayload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomJoinRequestRepository roomJoinRequestRepository;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;
    private final FriendService friendService;
    private final ProgressionService progressionService;
    private final QuestService questService;
    private final SimpMessagingTemplate messagingTemplate;

    public RoomService(
            RoomRepository roomRepository,
            RoomMemberRepository roomMemberRepository,
            RoomJoinRequestRepository roomJoinRequestRepository,
            ProfileRepository profileRepository,
            ProfileService profileService,
            FriendService friendService,
            ProgressionService progressionService,
            QuestService questService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomJoinRequestRepository = roomJoinRequestRepository;
        this.profileRepository = profileRepository;
        this.profileService = profileService;
        this.friendService = friendService;
        this.progressionService = progressionService;
        this.questService = questService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<RoomDto> listMyRooms(String query) {
        UUID userId = Authz.requireUserId();
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return roomRepository.findRoomsForUser(userId).stream()
                .map(room -> toRoomDto(room, userId))
                .filter(room -> normalized.isBlank() || matchesSearch(room, normalized))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomDto> discoverRooms(String query) {
        UUID userId = Authz.requireUserId();
        String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return roomRepository.findAllGroupRooms().stream()
                .map(room -> toRoomDto(room, userId))
                .filter(room -> normalized.isBlank() || matchesSearch(room, normalized))
                .toList();
    }

    @Transactional
    public RoomDto createRoom(CreateRoomRequest request) {
        Jwt jwt = Authz.requireJwt();
        profileService.getOrCreateProfile(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        RoomType type = request.type() != null ? request.type() : RoomType.group;
        if (type == RoomType.direct) {
            return createDirectRoom(userId, request.targetUserId());
        }
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isBlank()) {
            throw new IllegalArgumentException("Group rooms require a name");
        }
        if (request.targetUserId() != null) {
            throw new IllegalArgumentException("Group rooms cannot target a user");
        }
        if (roomRepository.existsGroupByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Room name already exists");
        }
        var profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (profile.getCoins() < 20) {
            throw new IllegalArgumentException("Creating a group room costs 20 coins");
        }
        progressionService.spendCoins(profile, 20);
        profileRepository.save(profile);
        RoomVisibility visibility = request.visibility() != null ? request.visibility() : RoomVisibility.public_room;
        Room room = new Room(UUID.randomUUID(), name, type, userId, visibility);
        roomRepository.save(room);
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), userId), "owner"));
        questService.handleGroupRoomCreated(userId);
        return toRoomDto(room, userId);
    }

    @Transactional(readOnly = true)
    public void assertMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            throw new AccessDeniedException("Not a member of this room");
        }
    }

    @Transactional(readOnly = true)
    public Room findRoom(UUID roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
    }

    @Transactional
    public RoomDto joinOrRequestAccess(UUID roomId) {
        UUID userId = Authz.requireUserId();
        Room room = findRoom(roomId);
        if (room.getType() != RoomType.group) {
            throw new IllegalArgumentException("Only group rooms can be joined");
        }
        if (roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            return toRoomDto(room, userId);
        }
        if (room.getVisibility() == RoomVisibility.public_room) {
            roomMemberRepository.save(new RoomMember(new RoomMemberId(roomId, userId), "member"));
            roomJoinRequestRepository.findByIdRoomIdAndIdUserId(roomId, userId).ifPresent(roomJoinRequestRepository::delete);
            return toRoomDto(room, userId);
        }
        RoomJoinRequest existing = roomJoinRequestRepository.findByIdRoomIdAndIdUserId(roomId, userId)
                .orElseGet(() -> new RoomJoinRequest(new RoomJoinRequestId(roomId, userId)));
        existing.setStatus("pending");
        existing.setReviewedAt(null);
        existing.setReviewedBy(null);
        roomJoinRequestRepository.save(existing);
        return toRoomDto(room, userId);
    }

    @Transactional(readOnly = true)
    public List<RoomJoinRequestDto> listJoinRequests(UUID roomId) {
        UUID userId = Authz.requireUserId();
        assertOwner(roomId, userId);
        return roomJoinRequestRepository.findByIdRoomIdAndStatusOrderByCreatedAtAsc(roomId, "pending").stream()
                .map(request -> profileRepository.findById(request.getId().getUserId())
                        .map(profile -> new RoomJoinRequestDto(
                                roomId,
                                DtoMapper.toProfileDto(profile, friendService.friendshipState(userId, profile.getId())),
                                request.getStatus(),
                                request.getCreatedAt()
                        ))
                        .orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    @Transactional
    public RoomDto approveJoinRequest(UUID roomId, UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        assertOwner(roomId, userId);
        Room room = findRoom(roomId);
        RoomJoinRequest request = roomJoinRequestRepository.findByIdRoomIdAndIdUserId(roomId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));
        request.setStatus("approved");
        request.setReviewedAt(java.time.Instant.now());
        request.setReviewedBy(userId);
        roomJoinRequestRepository.save(request);
        if (!roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, targetUserId)) {
            roomMemberRepository.save(new RoomMember(new RoomMemberId(roomId, targetUserId), "member"));
        }
        return toRoomDto(room, targetUserId);
    }

    @Transactional
    public void rejectJoinRequest(UUID roomId, UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        assertOwner(roomId, userId);
        RoomJoinRequest request = roomJoinRequestRepository.findByIdRoomIdAndIdUserId(roomId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));
        request.setStatus("rejected");
        request.setReviewedAt(java.time.Instant.now());
        request.setReviewedBy(userId);
        roomJoinRequestRepository.save(request);
    }

    @Transactional
    public RoomDto addMember(UUID roomId, UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        assertOwner(roomId, userId);
        Room room = findRoom(roomId);
        if (room.getType() != RoomType.group) {
            throw new IllegalArgumentException("Only group rooms support member invites");
        }
        profileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!friendService.areFriends(userId, targetUserId)) {
            throw new IllegalArgumentException("You can only add accepted friends");
        }
        if (!roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, targetUserId)) {
            roomMemberRepository.save(new RoomMember(new RoomMemberId(roomId, targetUserId), "member"));
        }
        roomJoinRequestRepository.findByIdRoomIdAndIdUserId(roomId, targetUserId).ifPresent(roomJoinRequestRepository::delete);
        return toRoomDto(room, targetUserId);
    }

    private void assertOwner(UUID roomId, UUID userId) {
        RoomMember member = roomMemberRepository.findByIdRoomIdAndIdUserId(roomId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this room"));
        if (!"owner".equalsIgnoreCase(member.getRole())) {
            throw new AccessDeniedException("Only the room owner can manage access");
        }
    }

    private RoomDto createDirectRoom(UUID userId, UUID targetUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("Direct rooms require a target user");
        }
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot start a direct room with yourself");
        }
        if (!friendService.areFriends(userId, targetUserId)) {
            throw new IllegalArgumentException("Direct messages are only available with accepted friends");
        }
        profileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        for (Room candidate : roomRepository.findDirectRoomsBetween(userId, targetUserId)) {
            if (roomMemberRepository.countByIdRoomId(candidate.getId()) == 2) {
                return toRoomDto(candidate, userId);
            }
        }
        ProfileDto targetProfile = profileRepository.findById(targetUserId)
                .map(profile -> DtoMapper.toProfileDto(profile, "accepted"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Room room = new Room(UUID.randomUUID(), targetProfile.displayName(), RoomType.direct, userId, RoomVisibility.private_room);
        roomRepository.save(room);
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), userId), "owner"));
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), targetUserId), "member"));
        return toRoomDto(room, userId);
    }

    @Transactional
    public void markRoomRead(UUID roomId) {
        UUID userId = Authz.requireUserId();
        assertMember(roomId, userId);
        RoomMember member = roomMemberRepository.findByIdRoomIdAndIdUserId(roomId, userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member"));
        member.setLastReadAt(Instant.now());
        roomMemberRepository.save(member);
        Room room = findRoom(roomId);
        if (room.getType() == RoomType.direct) {
            messagingTemplate.convertAndSend(
                    "/topic/rooms." + roomId,
                    new WsMessagePayload("ROOM_READ",
                            new RoomReadEventDto(roomId, userId, member.getLastReadAt()))
            );
        }
    }

    @Transactional
    public RoomDto toggleMute(UUID roomId) {
        UUID userId = Authz.requireUserId();
        RoomMember member = roomMemberRepository.findByIdRoomIdAndIdUserId(roomId, userId)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Not a member of this room"));
        member.setMuted(!member.isMuted());
        roomMemberRepository.save(member);
        return toRoomDto(findRoom(roomId), userId);
    }

    private RoomDto toRoomDto(Room room, UUID currentUserId) {
        ProfileDto directPeer = null;
        Instant peerLastReadAt = null;
        Optional<RoomMember> currentMemberOpt = roomMemberRepository.findByIdRoomIdAndIdUserId(room.getId(), currentUserId);
        boolean member = currentMemberOpt.isPresent();
        String currentUserRole = currentMemberOpt.map(RoomMember::getRole).orElse(null);
        boolean muted = currentMemberOpt.map(RoomMember::isMuted).orElse(false);
        long memberCount = roomMemberRepository.countByIdRoomId(room.getId());
        if (room.getType() == RoomType.direct) {
            Optional<RoomMember> peerOpt = roomMemberRepository.findByIdRoomId(room.getId()).stream()
                    .filter(m -> !m.getId().getUserId().equals(currentUserId))
                    .findFirst();
            if (peerOpt.isPresent()) {
                RoomMember peer = peerOpt.get();
                peerLastReadAt = peer.getLastReadAt();
                directPeer = profileRepository.findById(peer.getId().getUserId())
                        .map(p -> DtoMapper.toProfileDto(p, "accepted"))
                        .orElse(null);
            }
        }
        return DtoMapper.toRoomDto(room, directPeer, member, currentUserRole, memberCount, peerLastReadAt, muted);
    }

    private static boolean matchesSearch(RoomDto room, String normalized) {
        String roomName = room.name() == null ? "" : room.name().toLowerCase(Locale.ROOT);
        if (roomName.contains(normalized)) {
            return true;
        }
        if (room.directPeer() == null || room.directPeer().displayName() == null) {
            return false;
        }
        return room.directPeer().displayName().toLowerCase(Locale.ROOT).contains(normalized);
    }
}
