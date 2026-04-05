package com.postmanchat.web;

import com.postmanchat.service.QuestService;
import com.postmanchat.web.dto.QuestDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quests")
public class QuestController {

    private final QuestService questService;

    public QuestController(QuestService questService) {
        this.questService = questService;
    }

    @GetMapping
    public List<QuestDto> listMyQuests() {
        return questService.listMyQuests();
    }

    @PostMapping("/random")
    public QuestDto assignRandomQuest() {
        return questService.assignRandomQuest();
    }

    @PostMapping("/{questId}/complete")
    public QuestDto completeQuest(@PathVariable UUID questId) {
        return questService.completeQuest(questId);
    }

    @PostMapping("/friends/{targetUserId}/random")
    public QuestDto assignRandomQuestToFriend(@PathVariable UUID targetUserId) {
        return questService.assignRandomQuestToFriend(targetUserId);
    }
}
