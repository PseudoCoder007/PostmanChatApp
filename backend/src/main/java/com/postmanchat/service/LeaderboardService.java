package com.postmanchat.service;

import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.LeaderboardEntryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaderboardService {

    private final ProfileRepository profileRepository;
    private final FriendService friendService;

    public LeaderboardService(ProfileRepository profileRepository, FriendService friendService) {
        this.profileRepository = profileRepository;
        this.friendService = friendService;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> globalLeaderboard(int limit) {
        var currentUserId = Authz.requireUserId();
        int capped = Math.min(Math.max(limit, 1), 50);
        var ordered = profileRepository.findAll().stream()
                .sorted((a, b) -> {
                    int xpCmp = Integer.compare(b.getXp(), a.getXp());
                    if (xpCmp != 0) {
                        return xpCmp;
                    }
                    return a.getUsername().compareToIgnoreCase(b.getUsername());
                })
                .limit(capped)
                .toList();
        for (int i = 0; i < ordered.size(); i++) {
            // no-op, just keeping simple indexed transformation below
        }
        return java.util.stream.IntStream.range(0, ordered.size())
                .mapToObj(index -> new LeaderboardEntryDto(
                        index + 1,
                        DtoMapper.toProfileDto(
                                ordered.get(index),
                                friendService.friendshipState(currentUserId, ordered.get(index).getId())
                        )
                ))
                .toList();
    }
}
