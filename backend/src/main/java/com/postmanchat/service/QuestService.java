package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import com.postmanchat.domain.QuestTriggerType;
import com.postmanchat.domain.Room;
import com.postmanchat.domain.RoomType;
import com.postmanchat.domain.QuestTemplate;
import com.postmanchat.domain.Attachment;
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
    private final IgrisService igrisService;

    public QuestService(
            UserQuestRepository userQuestRepository,
            QuestTemplateRepository questTemplateRepository,
            ProfileRepository profileRepository,
            ProgressionService progressionService,
            FriendService friendService,
            IgrisService igrisService
    ) {
        this.userQuestRepository = userQuestRepository;
        this.questTemplateRepository = questTemplateRepository;
        this.profileRepository = profileRepository;
        this.progressionService = progressionService;
        this.friendService = friendService;
        this.igrisService = igrisService;
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
        UserQuest quest = buildIgrisQuest(userId);
        return toDto(userQuestRepository.save(quest));
    }

    @Transactional
    public QuestDto assignRandomQuestToFriend(UUID targetUserId) {
        UUID userId = Authz.requireUserId();
        Profile sender = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        progressionService.refreshUnlocks(sender);
        if (!sender.isFriendQuestsUnlocked()) {
            throw new IllegalArgumentException("Sending friend quests unlocks at 10 coins");
        }
        if (!friendService.areFriends(userId, targetUserId)) {
            throw new IllegalArgumentException("You can only send quests to friends");
        }
        Profile target = profileRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Friend not found"));
        if (userQuestRepository.countByUserIdAndStatus(targetUserId, UserQuestStatus.assigned) >= 3) {
            throw new IllegalArgumentException("Your friend already has enough active quests");
        }
        UserQuest quest = buildIgrisQuest(targetUserId);
        quest.setSource("friend_challenge");
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
        quest.setStatus(UserQuestStatus.completed);
        quest.setCompletedAt(Instant.now());
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        progressionService.grantRewards(profile, rewardXp(quest), rewardCoins(quest));
        profileRepository.save(profile);
        return toDto(userQuestRepository.save(quest));
    }

    @Transactional
    public void handleMessageActivity(UUID userId, Room room, String content, Attachment attachment) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        List<UserQuest> quests = userQuestRepository.findByUserIdOrderByAssignedAtDesc(userId).stream()
                .filter(quest -> quest.getStatus() == UserQuestStatus.assigned)
                .toList();
        for (UserQuest quest : quests) {
            QuestTriggerType triggerType = resolveTriggerType(quest);
            if (triggerType == QuestTriggerType.SEND_DIRECT_MESSAGE && room.getType() == RoomType.direct && !content.isBlank()) {
                completeAutomatically(profile, quest);
            }
            if (triggerType == QuestTriggerType.SEND_GROUP_MESSAGE && room.getType() == RoomType.group && !content.isBlank()) {
                completeAutomatically(profile, quest);
            }
            if (attachment != null && triggerType == QuestTriggerType.UPLOAD_IMAGE && attachment.getContentType().startsWith("image/")) {
                completeAutomatically(profile, quest);
            }
            if (attachment != null && triggerType == QuestTriggerType.UPLOAD_DOCUMENT && isDocument(attachment.getContentType(), attachment.getOriginalName())) {
                completeAutomatically(profile, quest);
            }
        }
    }

    @Transactional
    public void handleGroupRoomCreated(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        userQuestRepository.findByUserIdOrderByAssignedAtDesc(userId).stream()
                .filter(quest -> quest.getStatus() == UserQuestStatus.assigned)
                .filter(quest -> resolveTriggerType(quest) == QuestTriggerType.CREATE_GROUP_ROOM)
                .findFirst()
                .ifPresent(quest -> completeAutomatically(profile, quest));
    }

    private QuestDto toDto(UserQuest quest) {
        QuestTemplate template = quest.getTemplateId() != null
                ? questTemplateRepository.findById(quest.getTemplateId()).orElse(null)
                : null;
        String code = template != null ? template.getCode() : "igris_" + quest.getId();
        String title = quest.getCustomTitle() != null ? quest.getCustomTitle() : template != null ? template.getTitle() : "Quest";
        String description = quest.getCustomDescription() != null ? quest.getCustomDescription() : template != null ? template.getDescription() : "";
        return new QuestDto(
                quest.getId(),
                code,
                title,
                description,
                rewardXp(quest),
                rewardCoins(quest),
                quest.getStatus().name(),
                resolveTriggerType(quest).name(),
                quest.getTriggerTarget(),
                true,
                quest.getSource(),
                quest.getAssignedAt(),
                quest.getCompletedAt()
        );
    }

    private UserQuest buildIgrisQuest(UUID userId) {
        IgrisService.IgrisQuestIdea idea = igrisService.generateQuestIdea();
        UserQuest quest = new UserQuest(UUID.randomUUID(), userId, null);
        quest.setCustomTitle(idea.title());
        quest.setCustomDescription(idea.description());
        quest.setRewardXpOverride(idea.rewardXp());
        quest.setRewardCoinsOverride(idea.rewardCoins());
        quest.setTriggerType(idea.triggerType().name());
        quest.setTriggerTarget(idea.triggerTarget());
        quest.setSource("igris");
        return quest;
    }

    private int rewardXp(UserQuest quest) {
        if (quest.getRewardXpOverride() != null) {
            return quest.getRewardXpOverride();
        }
        return questTemplateRepository.findById(quest.getTemplateId())
                .map(QuestTemplate::getRewardXp)
                .orElse(20);
    }

    private int rewardCoins(UserQuest quest) {
        if (quest.getRewardCoinsOverride() != null) {
            return quest.getRewardCoinsOverride();
        }
        return questTemplateRepository.findById(quest.getTemplateId())
                .map(QuestTemplate::getRewardCoins)
                .orElse(2);
    }

    private QuestTriggerType resolveTriggerType(UserQuest quest) {
        if (quest.getTriggerType() != null && !quest.getTriggerType().isBlank()) {
            return QuestTriggerType.valueOf(quest.getTriggerType());
        }
        QuestTemplate template = questTemplateRepository.findById(quest.getTemplateId())
                .orElseThrow(() -> new IllegalArgumentException("Quest template not found"));
        return mapTemplateTrigger(template.getCode());
    }

    private static QuestTriggerType mapTemplateTrigger(String code) {
        return switch (code) {
            case "compliment_friend", "daily_check_in", "challenge_friend" -> QuestTriggerType.SEND_DIRECT_MESSAGE;
            case "group_starter" -> QuestTriggerType.SEND_GROUP_MESSAGE;
            default -> QuestTriggerType.SEND_GROUP_MESSAGE;
        };
    }

    private void completeAutomatically(Profile profile, UserQuest quest) {
        if (quest.getStatus() == UserQuestStatus.completed) {
            return;
        }
        quest.setStatus(UserQuestStatus.completed);
        quest.setCompletedAt(Instant.now());
        progressionService.grantRewards(profile, rewardXp(quest), rewardCoins(quest));
        profileRepository.save(profile);
        userQuestRepository.save(quest);
    }

    private static boolean isDocument(String contentType, String originalName) {
        if (contentType == null) {
            return hasDocumentExtension(originalName);
        }
        String normalized = contentType.toLowerCase();
        return normalized.startsWith("application/")
                || normalized.startsWith("text/")
                || hasDocumentExtension(originalName);
    }

    private static boolean hasDocumentExtension(String originalName) {
        if (originalName == null) {
            return false;
        }
        String lower = originalName.toLowerCase();
        return lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx")
                || lower.endsWith(".txt") || lower.endsWith(".ppt") || lower.endsWith(".pptx")
                || lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".zip");
    }
}
