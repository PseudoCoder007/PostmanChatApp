package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import com.postmanchat.repo.FriendshipRepository;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.ProfileDto;
import com.postmanchat.web.dto.UpdateProfileRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ProfileService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_]{3,24}$");

    private final ProfileRepository profileRepository;
    private final FriendService friendService;

    public ProfileService(ProfileRepository profileRepository, FriendService friendService) {
        this.profileRepository = profileRepository;
        this.friendService = friendService;
    }

    @Transactional
    public ProfileDto getOrCreateProfile(Jwt jwt) {
        UUID id = UUID.fromString(jwt.getSubject());
        return profileRepository.findById(id)
                .map(profile -> {
                    profile.setEmail(normalizeEmail(jwt.getClaimAsString("email")));
                    profile.setLastActiveAt(Instant.now());
                    return DtoMapper.toProfileDto(profileRepository.save(profile), null);
                })
                .orElseGet(() -> {
                    String display = firstNonBlank(
                            readMetadataName(jwt),
                            jwt.getClaimAsString("name"),
                            deriveFromEmail(jwt.getClaimAsString("email")),
                            "User"
                    );
                    String username = generateUniqueUsername(display);
                    Profile created = new Profile(id, display, username, null);
                    created.setEmail(normalizeEmail(jwt.getClaimAsString("email")));
                    return DtoMapper.toProfileDto(profileRepository.save(created), null);
                });
    }

    @Transactional(readOnly = true)
    public List<ProfileDto> searchProfiles(String query, int limit) {
        UUID currentUserId = Authz.requireUserId();
        String normalized = query == null ? "" : query.trim();
        if (normalized.isEmpty()) {
            return List.of();
        }
        int cappedLimit = Math.min(Math.max(limit, 1), 20);
        return profileRepository.searchByDisplayName(normalized).stream()
                .filter(profile -> !profile.getId().equals(currentUserId))
                .limit(cappedLimit)
                .map(profile -> DtoMapper.toProfileDto(profile, friendService.friendshipState(currentUserId, profile.getId())))
                .toList();
    }

    @Transactional
    public ProfileDto updateCurrentProfile(UpdateProfileRequest request) {
        UUID userId = Authz.requireUserId();
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (request.displayName() != null && !request.displayName().isBlank()) {
            profile.setDisplayName(request.displayName().trim());
        }
        if (request.username() != null) {
            String username = request.username().trim().toLowerCase();
            if (!USERNAME_PATTERN.matcher(username).matches()) {
                throw new IllegalArgumentException("Username must be 3-24 chars: lowercase letters, numbers, underscore");
            }
            if (!username.equalsIgnoreCase(profile.getUsername()) && profileRepository.existsByUsernameIgnoreCase(username)) {
                throw new IllegalArgumentException("Username is already taken");
            }
            profile.setUsername(username);
        }
        if (request.avatarUrl() != null) {
            if (!request.avatarUrl().trim().isBlank() && profile.getCoins() < 5) {
                throw new IllegalArgumentException("Profile photo unlock requires 5 coins");
            }
            profile.setAvatarUrl(request.avatarUrl().trim().isBlank() ? null : request.avatarUrl().trim());
        }
        profile.setLastActiveAt(Instant.now());
        return DtoMapper.toProfileDto(profileRepository.save(profile), null);
    }

    @Transactional
    public void touchPresence() {
        UUID userId = Authz.requireUserId();
        profileRepository.findById(userId).ifPresent(profile -> {
            profile.setLastActiveAt(Instant.now());
            profileRepository.save(profile);
        });
    }

    @Transactional(readOnly = true)
    public void assertIgrisUnlocked() {
        UUID userId = Authz.requireUserId();
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (profile.getCoins() < 5) {
            throw new IllegalArgumentException("Igris unlock requires 5 coins");
        }
    }

    @Transactional(readOnly = true)
    public Optional<Profile> findById(UUID userId) {
        return profileRepository.findById(userId);
    }

    private static String readMetadataName(Jwt jwt) {
        Object meta = jwt.getClaim("user_metadata");
        if (meta instanceof Map<?, ?> map) {
            Object n = map.get("name");
            if (n != null && !n.toString().isBlank()) {
                return n.toString().trim();
            }
            Object dn = map.get("display_name");
            if (dn != null && !dn.toString().isBlank()) {
                return dn.toString().trim();
            }
        }
        return null;
    }

    private static String deriveFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "User";
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return "User";
    }

    private static String normalizeEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase();
    }

    private String generateUniqueUsername(String seed) {
        String base = seed == null ? "user" : seed.trim().toLowerCase()
                .replaceAll("[^a-z0-9_]+", "_")
                .replaceAll("^_+|_+$", "");
        if (base.isBlank()) {
            base = "user";
        }
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }
        String candidate = base;
        int suffix = 1;
        while (profileRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + "_" + suffix;
            if (candidate.length() > 24) {
                candidate = candidate.substring(0, 24);
            }
            suffix++;
        }
        return candidate;
    }
}
