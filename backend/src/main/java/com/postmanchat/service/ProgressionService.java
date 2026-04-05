package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import org.springframework.stereotype.Service;

@Service
public class ProgressionService {

    public void grantRewards(Profile profile, int xp, int coins) {
        profile.setXp(profile.getXp() + Math.max(0, xp));
        profile.setCoins(profile.getCoins() + Math.max(0, coins));
        int level = Math.max(1, (profile.getXp() / 100) + 1);
        profile.setLevel(level);
        profile.setTitle(resolveTitle(level));
    }

    public void spendCoins(Profile profile, int coins) {
        int cost = Math.max(0, coins);
        if (profile.getCoins() < cost) {
            throw new IllegalArgumentException("Not enough coins");
        }
        profile.setCoins(profile.getCoins() - cost);
    }

    private static String resolveTitle(int level) {
        if (level >= 30) {
            return "Legend";
        }
        if (level >= 20) {
            return "Quest Master";
        }
        if (level >= 10) {
            return "Social Ninja";
        }
        if (level >= 5) {
            return "Explorer";
        }
        return "Newbie";
    }
}
