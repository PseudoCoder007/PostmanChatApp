package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class ProgressionService {

    private final ObjectProvider<EmailNotificationService> emailNotificationServiceProvider;
    private final ObjectProvider<NotificationService> notificationServiceProvider;

    public ProgressionService(
            ObjectProvider<EmailNotificationService> emailNotificationServiceProvider,
            ObjectProvider<NotificationService> notificationServiceProvider
    ) {
        this.emailNotificationServiceProvider = emailNotificationServiceProvider;
        this.notificationServiceProvider = notificationServiceProvider;
    }

    public void grantRewards(Profile profile, int xp, int coins) {
        int oldLevel = profile.getLevel();
        profile.setXp(profile.getXp() + Math.max(0, xp));
        profile.setCoins(profile.getCoins() + Math.max(0, coins));
        int newLevel = Math.max(1, (profile.getXp() / 100) + 1);
        profile.setLevel(newLevel);
        profile.setTitle(resolveTitle(newLevel));
        refreshUnlocks(profile);

        // Notify user if they leveled up
        if (newLevel > oldLevel) {
            String levelUpTitle = "🎉 Level Up!";
            String levelUpBody = "Congratulations! You've reached level " + newLevel + " - " + resolveTitle(newLevel) + "!";
            
            // Send email notification (if available)
            EmailNotificationService emailService = emailNotificationServiceProvider.getIfAvailable();
            if (emailService != null) {
                emailService.sendNotificationEmail(profile, levelUpTitle, levelUpBody);
            }
            
            // Send in-app notification (if available)
            NotificationService notificationService = notificationServiceProvider.getIfAvailable();
            if (notificationService != null) {
                notificationService.notifyUser(profile.getId(), "level_up", levelUpTitle, levelUpBody, null, null);
            }
        }
    }

    public void spendCoins(Profile profile, int coins) {
        int cost = Math.max(0, coins);
        if (profile.getCoins() < cost) {
            throw new IllegalArgumentException("Not enough coins");
        }
        profile.setCoins(profile.getCoins() - cost);
    }

    public void refreshUnlocks(Profile profile) {
        if (profile.getCoins() >= 5) {
            profile.setProfilePhotoUnlocked(true);
            profile.setIgrisUnlocked(true);
        }
        if (profile.getCoins() >= 10) {
            profile.setFriendQuestsUnlocked(true);
        }
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
