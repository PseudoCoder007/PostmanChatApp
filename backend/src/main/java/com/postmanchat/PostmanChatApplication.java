package com.postmanchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PostmanChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(PostmanChatApplication.class, args);
    }
}
