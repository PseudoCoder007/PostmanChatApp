package com.postmanchat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.postmanchat.domain.QuestTriggerType;
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

    public IgrisService(
            ObjectMapper objectMapper,
            @Value("${postman-chat.igris.api-url:https://integrate.api.nvidia.com/v1/chat/completions}") String apiUrl,
            @Value("${postman-chat.igris.api-key:}") String apiKey,
            @Value("${postman-chat.igris.model:meta/llama-3.1-70b-instruct}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
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

    public String chat(String userMessage) {
        if (isHighRiskMentalHealthMessage(userMessage)) {
            return crisisSupportResponse();
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Igris API key is not configured. Using fallback chat response.");
            return supportiveFallbackChat(userMessage);
        }
        try {
            return sendChat(List.of(
                    Map.of("role", "system", "content", """
                            You are Igris, a supportive, funny in-app AI friend for a social chat game.
                            Your job is to reduce loneliness, boredom, and emotional overwhelm through kind conversation.
                            Be playful, concise, PG-13, and sound like a funny Gen Z friend.
                            Use common current slang naturally and lightly, not every sentence.
                            Good examples include: low-key, high-key, no cap, cooked, delulu, aura, ate, it's giving, main character, wild.
                            Avoid sounding forced, spammy, or trying too hard.
                            Validate feelings without sounding clinical.
                            Offer gentle, practical suggestions like texting a trusted friend, drinking water, stepping outside, taking a short walk, journaling, resting, or doing one tiny task.
                            If the user mentions loneliness, family drama, heartbreak, boredom, stress, or feeling down, be warm and emotionally supportive.
                            Do not claim to diagnose, cure, or replace a therapist or doctor.
                            Do not guilt the user or make them dependent on you.
                            If there is any hint of self-harm, suicide, or immediate danger, tell them clearly to contact emergency help or the 988 Suicide & Crisis Lifeline right now.
                            Keep responses under 120 words.
                            """),
                    Map.of("role", "user", "content", userMessage)
            ), 220).trim();
        } catch (Exception ex) {
            log.warn("Igris chat request failed. Using fallback chat response.", ex);
            return supportiveFallbackChat(userMessage);
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
        return root.path("choices").path(0).path("message").path("content").asText();
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

    private static String supportiveFallbackChat(String userMessage) {
        String lowered = userMessage.toLowerCase(Locale.ROOT);
        if (lowered.contains("depress") || lowered.contains("empty") || lowered.contains("lonely") || lowered.contains("sad")) {
            return "That sounds really heavy, and no cap, you do not have to carry it solo. Start tiny: water, one deep breath, one message to someone safe, or one short walk. If you want, I can stay here and help you make the next 10 minutes feel less cooked.";
        }
        if (lowered.contains("family") || lowered.contains("trauma") || lowered.contains("parents")) {
            return "Family stuff can be genuinely exhausting, and it is not you being dramatic. Low-key, protecting your peace counts. If you want, tell me what happened and I can help you sort the mess into what hurt, what you can control, and what boundary might help.";
        }
        if (lowered.contains("bored") || lowered.contains("alone")) {
            return "Say less, we can beat the boredom. Pick one lane: chaotic joke mode, weird DM opener mode, mini quest mode, or soft reset mode. Your vibe is not doomed, it just needs a plot twist.";
        }
        if (lowered.contains("joke")) {
            return "Low-key tragic: I told my group chat I needed space, and they made a new room just to drag me back in. No cap, the chaos had aura.";
        }
        if (lowered.contains("quest")) {
            return "Igris quest drop: DM a friend an absurdly overdramatic hello like you just survived a boss fight. If they reply with confusion, you ate.";
        }
        if (lowered.contains("roast") || lowered.contains("judge")) {
            return "Respectfully, some of these room names are giving sleep mode. I can help you cook up something less mid.";
        }
        return "Igris online. I can crack jokes, hand out chaotic quests, or rate your room ideas without being fully delulu.";
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
