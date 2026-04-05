package com.postmanchat.service;

import com.postmanchat.domain.Friendship;
import com.postmanchat.domain.FriendshipId;
import com.postmanchat.domain.FriendshipStatus;
import com.postmanchat.domain.Profile;
import com.postmanchat.repo.FriendshipRepository;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.FriendRequestDto;
import com.postmanchat.web.dto.ProfileDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final ProfileRepository profileRepository;

    public FriendService(FriendshipRepository friendshipRepository, ProfileRepository profileRepository) {
        this.friendshipRepository = friendshipRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> listFriendships() {
        UUID userId = Authz.requireUserId();
        return friendshipRepository.findForUser(userId).stream()
                .map(friendship -> toDto(friendship, userId))
                .toList();
    }

    @Transactional
    public FriendRequestDto sendRequest(UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot send a friend request to yourself");
        }
        Profile target = profileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        FriendshipId id = pair(userId, targetUserId);
        Friendship friendship = friendshipRepository.findById(id).orElse(null);
        if (friendship != null) {
            if (friendship.getStatus() == FriendshipStatus.accepted) {
                throw new IllegalArgumentException("You are already friends");
            }
            if (friendship.getStatus() == FriendshipStatus.pending) {
                if (friendship.getRequestedBy().equals(userId)) {
                    throw new IllegalArgumentException("Friend request already sent");
                }
                throw new IllegalArgumentException("This user already sent you a request. Accept it instead.");
            }
            friendship.setStatus(FriendshipStatus.pending);
            friendship.setRequestedBy(userId);
            friendship.setRespondedAt(null);
        } else {
            friendship = new Friendship(id, userId, FriendshipStatus.pending);
        }
        Friendship saved = friendshipRepository.save(friendship);
        touchLastActive(userId);
        return toDto(saved, userId);
    }

    @Transactional
    public FriendRequestDto acceptRequest(UUID otherUserId) {
        UUID userId = Authz.requireUserId();
        Friendship friendship = friendshipRepository.findById(pair(userId, otherUserId))
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (friendship.getStatus() != FriendshipStatus.pending || friendship.getRequestedBy().equals(userId)) {
            throw new IllegalArgumentException("No incoming friend request to accept");
        }
        friendship.setStatus(FriendshipStatus.accepted);
        friendship.setRespondedAt(Instant.now());
        Friendship saved = friendshipRepository.save(friendship);
        touchLastActive(userId);
        return toDto(saved, userId);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(UUID firstUserId, UUID secondUserId) {
        FriendshipId id = pair(firstUserId, secondUserId);
        return friendshipRepository.existsByUsersAndStatus(id.getUserLowId(), id.getUserHighId(), FriendshipStatus.accepted);
    }

    @Transactional(readOnly = true)
    public String friendshipState(UUID currentUserId, UUID otherUserId) {
        if (currentUserId.equals(otherUserId)) {
            return "self";
        }
        Friendship friendship = friendshipRepository.findById(pair(currentUserId, otherUserId)).orElse(null);
        if (friendship == null) {
            return "none";
        }
        if (friendship.getStatus() == FriendshipStatus.accepted) {
            return "accepted";
        }
        if (friendship.getRequestedBy().equals(currentUserId)) {
            return "outgoing";
        }
        if (friendship.getStatus() == FriendshipStatus.pending) {
            return "incoming";
        }
        return "none";
    }

    private FriendRequestDto toDto(Friendship friendship, UUID currentUserId) {
        UUID otherUserId = friendship.getId().getUserLowId().equals(currentUserId)
                ? friendship.getId().getUserHighId()
                : friendship.getId().getUserLowId();
        Profile profile = profileRepository.findById(otherUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new FriendRequestDto(
                DtoMapper.toProfileDto(profile, friendshipState(currentUserId, otherUserId)),
                friendshipState(currentUserId, otherUserId),
                friendship.getCreatedAt()
        );
    }

    private void touchLastActive(UUID userId) {
        profileRepository.findById(userId).ifPresent(profile -> {
            profile.setLastActiveAt(Instant.now());
            profileRepository.save(profile);
        });
    }

    private static FriendshipId pair(UUID firstUserId, UUID secondUserId) {
        if (firstUserId.toString().compareTo(secondUserId.toString()) <= 0) {
            return new FriendshipId(firstUserId, secondUserId);
        }
        return new FriendshipId(secondUserId, firstUserId);
    }
}
