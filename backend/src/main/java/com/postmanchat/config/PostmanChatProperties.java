package com.postmanchat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "postman-chat")
public class PostmanChatProperties {

    private final Cors cors = new Cors();
    private final Messages messages = new Messages();
    private final Storage storage = new Storage();

    public Cors getCors() {
        return cors;
    }

    public Messages getMessages() {
        return messages;
    }

    public Storage getStorage() {
        return storage;
    }

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:5173"));

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Messages {
        private int maxContentLength = 8000;

        public int getMaxContentLength() {
            return maxContentLength;
        }

        public void setMaxContentLength(int maxContentLength) {
            this.maxContentLength = maxContentLength;
        }
    }

    public static class Storage {
        private String uploadDir = "backend/uploads";
        private long maxUploadBytes = 52_428_800L;

        public String getUploadDir() {
            return uploadDir;
        }

        public void setUploadDir(String uploadDir) {
            this.uploadDir = uploadDir;
        }

        public long getMaxUploadBytes() {
            return maxUploadBytes;
        }

        public void setMaxUploadBytes(long maxUploadBytes) {
            this.maxUploadBytes = maxUploadBytes;
        }
    }
}
