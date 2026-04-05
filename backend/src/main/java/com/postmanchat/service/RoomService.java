package com.postmanchat.service;

import com.postmanchat.domain.Room;
import com.postmanchat.domain.RoomMember;
import com.postmanchat.domain.RoomMemberId;
import com.postmanchat.domain.RoomType;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.repo.RoomMemberRepository;
import com.postmanchat.repo.RoomRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.CreateRoomRequest;
import com.postmanchat.web.dto.ProfileDto;
import com.postmanchat.web.dto.RoomDto;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;
    private final FriendService friendService;

    public RoomService(
            RoomRepository roomRepository,
            RoomMemberRepository roomMemberRepository,
            ProfileRepository profileRepository,
            ProfileService profileService,
            FriendService friendService
    ) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.profileRepository = profileRepository;
        this.profileService = profileService;
        this.friendService = friendService;
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
        Room room = new Room(UUID.randomUUID(), name, type, userId);
        roomRepository.save(room);
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), userId), "owner"));
        return toRoomDto(room, userId);
    }

    @Transactional(readOnly = true)
    public void assertMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            throw new AccessDeniedException("Not a member of this room");
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
        Room room = new Room(UUID.randomUUID(), targetProfile.displayName(), RoomType.direct, userId);
        roomRepository.save(room);
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), userId), "owner"));
        roomMemberRepository.save(new RoomMember(new RoomMemberId(room.getId(), targetUserId), "member"));
        return toRoomDto(room, userId);
    }

    private RoomDto toRoomDto(Room room, UUID currentUserId) {
        ProfileDto directPeer = null;
        if (room.getType() == RoomType.direct) {
            directPeer = roomMemberRepository.findByIdRoomId(room.getId()).stream()
                    .map(RoomMember::getId)
                    .map(RoomMemberId::getUserId)
                    .filter(memberId -> !memberId.equals(currentUserId))
                    .findFirst()
                    .flatMap(profileRepository::findById)
                    .map(profile -> DtoMapper.toProfileDto(profile, "accepted"))
                    .orElse(null);
        }
        return DtoMapper.toRoomDto(room, directPeer);
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
