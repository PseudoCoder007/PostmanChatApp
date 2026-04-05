package com.postmanchat.web;

import com.postmanchat.service.LeaderboardService;
import com.postmanchat.web.dto.LeaderboardEntryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public List<LeaderboardEntryDto> global(@RequestParam(name = "limit", defaultValue = "10") int limit) {
        return leaderboardService.globalLeaderboard(limit);
    }
}
