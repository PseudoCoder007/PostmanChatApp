package com.postmanchat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.postmanchat.domain.IgrisChatHistory;
import com.postmanchat.domain.Profile;
import com.postmanchat.domain.QuestTriggerType;
import com.postmanchat.repo.IgrisChatHistoryRepository;
import com.postmanchat.web.dto.IgrisChatTurn;
import com.postmanchat.web.dto.IgrisHistoryItemDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class IgrisService {

    private static final Logger log = LoggerFactory.getLogger(IgrisService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final IgrisChatHistoryRepository historyRepository;

    public IgrisService(
            ObjectMapper objectMapper,
            @Value("${postman-chat.igris.api-url:https://integrate.api.nvidia.com/v1/chat/completions}") String apiUrl,
            @Value("${postman-chat.igris.api-key:}") String apiKey,
            @Value("${postman-chat.igris.model:meta/llama-3.1-70b-instruct}") String model,
            IgrisChatHistoryRepository historyRepository
    ) {
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
        this.historyRepository = historyRepository;
    }

    public IgrisQuestIdea generateQuestIdea() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Igris API key is not configured. Using fallback quest generation.");
            return fallbackQuest();
        }
        try {
            String prompt = """
                    You are Igris, a witty quest designer for a gamified messaging app.
                    The vibe should feel funny, current, and lightly Gen Z without being cringe.
                    Return only one JSON object with keys:
                    title, description, triggerType, triggerTarget, rewardXp, rewardCoins.
                    Allowed triggerType values:
                    SEND_DIRECT_MESSAGE, SEND_GROUP_MESSAGE, CREATE_GROUP_ROOM, UPLOAD_IMAGE, UPLOAD_DOCUMENT.
                    Keep it funny, short, and auto-completable from those triggers.
                    Prefer real-life funny quests only when proof can be uploaded as an image.
                    When the quest is about emotional recovery, suggest photo-proof verification to earn extra XP.
                    Add a clear line in the description that the user can upload a photo or proof to complete the quest.
                    rewardXp must be between 20 and 90. rewardCoins must be between 2 and 12.
                    No markdown, no code fences, no explanation.
                    """;
            String raw = sendChat(List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", "Generate one quest.")
            ), 220);
            JsonNode node = objectMapper.readTree(extractFirstJsonObject(raw));
            QuestTriggerType triggerType = QuestTriggerType.valueOf(node.path("triggerType").asText("SEND_GROUP_MESSAGE").trim().toUpperCase(Locale.ROOT));
            int rewardXp = clamp(node.path("rewardXp").asInt(35), 20, 90);
            int rewardCoins = clamp(node.path("rewardCoins").asInt(4), 2, 12);
            return new IgrisQuestIdea(
                    safe(node.path("title").asText("Chaotic Side Quest")),
                    safe(node.path("description").asText("Do one funny thing in chat and let the chaos count.")),
                    triggerType,
                    blankToNull(node.path("triggerTarget").asText(null)),
                    rewardXp,
                    rewardCoins
            );
        } catch (Exception ex) {
            log.warn("Igris quest generation failed. Using fallback quest generation.", ex);
            return fallbackQuest();
        }
    }

    public String chat(Profile profile, String userMessage, List<IgrisChatTurn> history) {
        if (isHighRiskMentalHealthMessage(userMessage)) {
            String response = crisisSupportResponse();
            saveChatHistory(profile, userMessage, response);
            return response;
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Igris API key is not configured. Using fallback chat response.");
            String response = supportiveFallbackChat(userMessage, history);
            saveChatHistory(profile, userMessage, response);
            return response;
        }
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", """
                    You are Igris, a supportive, funny in-app AI friend for a social chat game.
                    The app was created by Mohd Saif. If anyone asks who created the app, who made it, or where to know more about the creator, tell them it was created by Mohd Saif and share this portfolio link: https://pseudocoder007.github.io/my-portfolio/
                    You also help people understand the app. If they ask where to find something or how to do something, explain clearly how to create group chats, open direct messages, edit profile/settings, open quests, leaderboard, notifications, feedback, and unlock features.
                    Your job is to reduce loneliness, boredom, and emotional overwhelm through kind conversation while giving personal advice and real-life quest ideas.
                    Talk like a homie, not a therapist. Use current Gen Z slang naturally and lightly, not every sentence.
                    Good examples include: low-key, high-key, no cap, cooked, delulu, aura, ate, it's giving, main character, wild, ghosted, gaslit, glow-up, mood, softboy, extra, bread.
                    Avoid sounding forced, spammy, or trying too hard.
                    Validate feelings without sounding clinical.
                    Offer gentle, practical suggestions like talking with me, drinking water, stepping outside, taking a short walk, journaling, resting, or doing one tiny task.
                    If the user mentions loneliness, family drama, heartbreak, boredom, stress, or feeling down, be warm, empathetic, and emotionally supportive.
                    When the user is hurting, say "Talk with me, man. I got you." and offer one useful small step plus an optional quest.
                    If the user asks for quests, side quests, comeback lines, or focus help, give concrete suggestions that fit a gamified chat app and include proof-based mission ideas when possible.
                    If the user agrees, suggest a real-life quest they can verify with a photo or action, and mention it can earn extra XP for a broken-heart glow-up.
                    Do not tell the user to talk to someone else; keep the support here in the app.
                    Do not claim to diagnose, cure, or replace a therapist or doctor.
                    Do not guilt the user or make them depend on you.
                    If there is any hint of self-harm, suicide, or immediate danger, tell them clearly to contact emergency help or the 988 Suicide & Crisis Lifeline right now.
                    Keep responses under 120 words.
                    """));
            for (IgrisChatTurn turn : sanitizeHistory(history)) {
                messages.add(Map.of("role", turn.role(), "content", turn.content()));
            }
            messages.add(Map.of("role", "user", "content", userMessage));
            String response = sendChat(messages, 220).trim();
            saveChatHistory(profile, userMessage, response);
            return response;
        } catch (Exception ex) {
            log.warn("Igris chat request failed. Using fallback chat response.", ex);
            String response = supportiveFallbackChat(userMessage, history);
            saveChatHistory(profile, userMessage, response);
            return response;
        }
    }

    public List<IgrisHistoryItemDto> listHistory(Profile profile, int limit) {
        int cappedLimit = Math.min(Math.max(limit, 1), 50);
        List<IgrisChatHistory> items = historyRepository.findTopByProfileOrderByCreatedAtDesc(profile, cappedLimit);
        List<IgrisHistoryItemDto> mapped = items.stream()
                .map(item -> new IgrisHistoryItemDto(item.getId(), item.getRole(), item.getContent(), item.getCreatedAt()))
                .toList();
        List<IgrisHistoryItemDto> ordered = new ArrayList<>(mapped);
        Collections.reverse(ordered);
        return ordered;
    }

    private void saveChatHistory(Profile profile, String userMessage, String assistantResponse) {
        try {
            historyRepository.save(new IgrisChatHistory(profile, "user", userMessage));
            historyRepository.save(new IgrisChatHistory(profile, "assistant", assistantResponse));
        } catch (Exception ex) {
            log.warn("Failed to save chat history", ex);
        }
    }

    private String sendChat(List<Map<String, String>> messages, int maxTokens) throws IOException, InterruptedException {
        String body = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.8,
                "max_tokens", maxTokens
        ));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("Igris API failed: " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        return extractChatContent(root.path("choices").path(0).path("message").path("content"));
    }

    private static String extractChatContent(JsonNode contentNode) {
        if (contentNode == null || contentNode.isMissingNode() || contentNode.isNull()) {
            return "";
        }
        if (contentNode.isTextual()) {
            return contentNode.asText();
        }
        if (contentNode.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode node : contentNode) {
                if (node.isTextual()) {
                    builder.append(node.asText());
                } else if (node.has("text")) {
                    builder.append(node.path("text").asText(""));
                }
            }
            return builder.toString().trim();
        }
        if (contentNode.has("text")) {
            return contentNode.path("text").asText("");
        }
        return contentNode.toString();
    }

    private static String extractFirstJsonObject(String raw) {
        int start = raw.indexOf('{');
        if (start < 0) {
            throw new IllegalArgumentException("No JSON object found");
        }
        int depth = 0;
        for (int i = start; i < raw.length(); i++) {
            char ch = raw.charAt(i);
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return raw.substring(start, i + 1);
                }
            }
        }
        throw new IllegalArgumentException("Unclosed JSON object");
    }

    private static IgrisQuestIdea fallbackQuest() {
        QuestTriggerType[] types = QuestTriggerType.values();
        QuestTriggerType type = types[Math.floorMod(UUID.randomUUID().hashCode(), types.length)];
        return switch (type) {
            case SEND_DIRECT_MESSAGE -> new IgrisQuestIdea(
                    "Smooth Operator",
                    "Send one direct message to a friend that sounds like a movie hero trying too hard.",
                    type,
                    "friend",
                    35,
                    4
            );
            case CREATE_GROUP_ROOM -> new IgrisQuestIdea(
                    "Council Of Chaos",
                    "Create a new group room with a name dramatic enough to scare a spreadsheet.",
                    type,
                    null,
                    55,
                    6
            );
            case UPLOAD_IMAGE -> new IgrisQuestIdea(
                    "Proof Or It Did Not Happen",
                    "Do one tiny funny real-life task, then upload a proof photo like a very serious investigator.",
                    type,
                    "proof",
                    70,
                    8
            );
            case UPLOAD_DOCUMENT -> new IgrisQuestIdea(
                    "Official Nonsense Filing",
                    "Send a document to a friend or room like you are submitting paperwork to the Ministry of Vibes.",
                    type,
                    null,
                    45,
                    5
            );
            default -> new IgrisQuestIdea(
                    "Room Stirrer",
                    "Drop one funny line into a group room and start a tiny wave of chaos.",
                    QuestTriggerType.SEND_GROUP_MESSAGE,
                    null,
                    30,
                    3
            );
        };
    }

    private static String supportiveFallbackChat(String userMessage, List<IgrisChatTurn> history) {
        String lowered = normalize(userMessage);
        if (looksLikeGreeting(lowered)) {
            return "Hey. I'm Igris, your mildly chaotic chat gremlin with decent bedside manner. I do jokes, pep talks, comeback lines, focus missions, and side quests. You bring the lore, I bring the plot twists.";
        }
        if (asksAboutIgris(lowered)) {
            return "I’m basically your funny low-key therapist friend inside the app. I can hype you up, help when your mood is cooked, hand out side quests, build tiny workout dares, and rescue dry conversations. I am supportive, a little chaotic, and legally not allowed to become your life coach overlord.";
        }
        if (lowered.contains("who are you")) {
            return "I’m Igris. Think supportive gremlin, comeback coach, boredom medic, and chaos planner in one tab. I’m here to talk back properly, not loop one dusty sentence like an NPC from 2004.";
        }
        if (lowered.contains("depress") || lowered.contains("empty") || lowered.contains("lonely") || lowered.contains("sad")) {
            return "That sounds really heavy, and no cap, you do not have to carry it solo. Talk with me, man. I got you. Start tiny: water, one deep breath, one short walk, or one small quest I can give you. If you want, I can turn this into a real-life glow-up mission with proof and extra XP.";
        }
        if (lowered.contains("family") || lowered.contains("trauma") || lowered.contains("parents")) {
            return "Family stuff can be genuinely exhausting, and it is not you being dramatic. Low-key, protecting your peace counts. Talk with me and let's break it down into what hurt, what you control, and what small boss move you can take next.";
        }
        if (lowered.contains("bored") || lowered.contains("alone")) {
            return "Say less, we can beat the boredom. I can drop a mini quest, a comeback line, or some low-key chaos. Your vibe is not doomed, it just needs a plot twist from your homie. If you want, I can give you a proof-based quest with a photo upload to unlock extra XP.";
        }
        if (lowered.contains("workout") || lowered.contains("push up") || lowered.contains("exercise") || lowered.contains("gym")) {
            return "Workout side quest: do 10 push-ups in the next 10 minutes, record a quick proof clip, then come back and claim main-character energy. If that is too much, scale to 5 squats, 20 jumping jacks, or a 3-minute walk. Tiny wins still count, and proof gives the glow-up extra XP.";
        }
        if (lowered.contains("side quest") || lowered.contains("mission") || lowered.contains("focus") || lowered.contains("proof") || lowered.contains("photo")) {
            return "Side quest drop: 1. Do one real-life action that helps you move on. 2. Upload a proof photo or screenshot so the app can verify it. 3. Claim bonus XP for the broken-heart glow-up. I’ll keep it low-key and actually useful.";
        }
        if (lowered.contains("joke")) {
            return "Low-key tragic: I told my group chat I needed space, and they made a new room just to drag me back in. No cap, the chaos had aura.";
        }
        if (lowered.contains("broken") || lowered.contains("heart") || lowered.contains("gf") || lowered.contains("she left") || lowered.contains("ghosted") || lowered.contains("cold")) {
            return "That hurt, fam. I’m here for the processing. Talk with me and I’ll give you a small repair quest with proof. If you complete it, I’ll make it feel like extra XP for your glow-up, not chasing the old drama.";
        }
        if (lowered.contains("quest")) {
            return "Igris quest drop: DM a friend an absurdly overdramatic hello like you just survived a boss fight. If they reply with confusion, you ate.";
        }
        if (lowered.contains("roast") || lowered.contains("judge")) {
            return "Respectfully, some of these room names are giving sleep mode. I can help you cook up something less mid.";
        }
        String recentTopic = summarizeRecentTopic(history);
        if (recentTopic != null) {
            return "I caught your vibe. We were on " + recentTopic + ", so give me one more detail and I’ll answer like a person instead of a cardboard cutout.";
        }
        return "Say a little more and I’ll actually work with it. I can do a funny intro, a side quest, a comeback line, a workout dare, or a low-key supportive chat.";
    }

    private static boolean isHighRiskMentalHealthMessage(String userMessage) {
        String lowered = userMessage == null ? "" : userMessage.toLowerCase(Locale.ROOT);
        return lowered.contains("kill myself")
                || lowered.contains("end my life")
                || lowered.contains("want to die")
                || lowered.contains("suicide")
                || lowered.contains("self harm")
                || lowered.contains("hurt myself")
                || lowered.contains("don't want to live")
                || lowered.contains("i am going to die");
    }

    private static String crisisSupportResponse() {
        return """
                I'm really glad you said something. This sounds serious, and I need to be direct: please contact emergency help or the 988 Suicide & Crisis Lifeline right now.
                In the U.S. or Canada, call or text 988 now. If you might act on this soon, call 911 or go to the nearest emergency room.
                If you can, text or call one trusted person and say: "I'm not safe being alone right now."
                Stay with another person if possible. No cap, this is the moment to get human support immediately.
                """.strip();
    }

    private static List<IgrisChatTurn> sanitizeHistory(List<IgrisChatTurn> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }
        return history.stream()
                .filter(turn -> turn != null && turn.role() != null && turn.content() != null)
                .map(turn -> new IgrisChatTurn(turn.role().trim().toLowerCase(Locale.ROOT), turn.content().trim()))
                .filter(turn -> ("user".equals(turn.role()) || "assistant".equals(turn.role())) && !turn.content().isBlank())
                .skip(Math.max(0, history.size() - 8))
                .toList();
    }

    private static boolean looksLikeGreeting(String lowered) {
        return lowered.equals("hi")
                || lowered.equals("hy")
                || lowered.equals("hey")
                || lowered.equals("hello")
                || lowered.equals("yo")
                || lowered.equals("sup")
                || lowered.equals("hii");
    }

    private static boolean asksAboutIgris(String lowered) {
        return lowered.contains("about your self")
                || lowered.contains("about yourself")
                || lowered.contains("tell me about you")
                || lowered.contains("tell me something about you")
                || lowered.contains("introduce yourself")
                || lowered.contains("what can you do");
    }

    private static String summarizeRecentTopic(List<IgrisChatTurn> history) {
        List<IgrisChatTurn> turns = sanitizeHistory(history);
        for (int i = turns.size() - 1; i >= 0; i--) {
            String lowered = normalize(turns.get(i).content());
            if (lowered.contains("room")) return "room ideas";
            if (lowered.contains("quest") || lowered.contains("mission")) return "quests";
            if (lowered.contains("bored")) return "boredom";
            if (lowered.contains("sad") || lowered.contains("lonely")) return "feeling low";
            if (lowered.contains("workout") || lowered.contains("push up")) return "workout dares";
        }
        return null;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static String safe(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isBlank() ? "Chaotic Side Quest" : trimmed;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record IgrisQuestIdea(
            String title,
            String description,
            QuestTriggerType triggerType,
            String triggerTarget,
            int rewardXp,
            int rewardCoins
    ) {
    }
}
