package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import com.postmanchat.domain.QuestTemplate;
import com.postmanchat.domain.UserQuest;
import com.postmanchat.domain.UserQuestStatus;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.repo.QuestTemplateRepository;
import com.postmanchat.repo.UserQuestRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.QuestDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class QuestService {

    private final UserQuestRepository userQuestRepository;
    private final QuestTemplateRepository questTemplateRepository;
    private final ProfileRepository profileRepository;
    private final ProgressionService progressionService;
    private final FriendService friendService;

    public QuestService(
            UserQuestRepository userQuestRepository,
            QuestTemplateRepository questTemplateRepository,
            ProfileRepository profileRepository,
            ProgressionService progressionService,
            FriendService friendService
    ) {
        this.userQuestRepository = userQuestRepository;
        this.questTemplateRepository = questTemplateRepository;
        this.profileRepository = profileRepository;
        this.progressionService = progressionService;
        this.friendService = friendService;
    }

    @Transactional(readOnly = true)
    public List<QuestDto> listMyQuests() {
        UUID userId = Authz.requireUserId();
        return userQuestRepository.findByUserIdOrderByAssignedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public QuestDto assignRandomQuest() {
        UUID userId = Authz.requireUserId();
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (userQuestRepository.countByUserIdAndStatus(userId, UserQuestStatus.assigned) >= 3) {
            throw new IllegalArgumentException("Finish one of your current quests before generating another");
        }
        QuestTemplate template = questTemplateRepository.findActiveTemplates().stream()
                .filter(candidate -> candidate.getMinLevel() <= profile.getLevel())
                .filter(candidate -> !userQuestRepository.existsByUserIdAndTemplateIdAndStatus(userId, candidate.getId(), UserQuestStatus.assigned))
                .min(Comparator.comparing(QuestTemplate::getTitle))
                .orElseThrow(() -> new IllegalArgumentException("No quest available right now"));
        UserQuest quest = new UserQuest(UUID.randomUUID(), userId, template.getId());
        return toDto(userQuestRepository.save(quest));
    }

    @Transactional
    public QuestDto assignRandomQuestToFriend(UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        Profile sender = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (sender.getCoins() < 10) {
            throw new IllegalArgumentException("Sending friend quests unlocks at 10 coins");
        }
        if (!friendService.areFriends(userId, targetUserId)) {
            throw new IllegalArgumentException("You can only send quests to friends");
        }
        Profile target = profileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Friend not found"));
        QuestTemplate template = questTemplateRepository.findActiveTemplates().stream()
                .filter(candidate -> candidate.getMinLevel() <= target.getLevel())
                .filter(candidate -> !userQuestRepository.existsByUserIdAndTemplateIdAndStatus(targetUserId, candidate.getId(), UserQuestStatus.assigned))
                .min(Comparator.comparing(QuestTemplate::getTitle))
                .orElseThrow(() -> new IllegalArgumentException("No quest available for this friend"));
        UserQuest quest = new UserQuest(UUID.randomUUID(), targetUserId, template.getId());
        return toDto(userQuestRepository.save(quest));
    }

    @Transactional
    public QuestDto completeQuest(UUID questId) {
        UUID userId = Authz.requireUserId();
        UserQuest quest = userQuestRepository.findByIdAndUserId(questId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Quest not found"));
        if (quest.getStatus() == UserQuestStatus.completed) {
            throw new IllegalArgumentException("Quest already completed");
        }
        QuestTemplate template = questTemplateRepository.findById(quest.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("Quest template not found"));
        quest.setStatus(UserQuestStatus.completed);
        quest.setCompletedAt(Instant.now());
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        progressionService.grantRewards(profile, template.getRewardXp(), template.getRewardCoins());
        profileRepository.save(profile);
        return toDto(userQuestRepository.save(quest));
    }

    private QuestDto toDto(UserQuest quest) {
        QuestTemplate template = questTemplateRepository.findById(quest.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("Quest template not found"));
        return new QuestDto(
                quest.getId(),
                template.getCode(),
                template.getTitle(),
                template.getDescription(),
                template.getRewardXp(),
                template.getRewardCoins(),
                quest.getStatus().name(),
                quest.getAssignedAt(),
                quest.getCompletedAt()
        );
    }
}
