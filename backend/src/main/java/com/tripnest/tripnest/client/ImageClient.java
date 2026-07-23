package com.tripnest.tripnest.client;

import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class ImageClient {

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String getHeroImage(String destinationName) {
        String query = destinationName.replaceAll(" ", "");
        return "https://loremflickr.com/1280/720/" + query + ",landmark";
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public List<String> getGalleryImages(String destinationName) {
        String query = destinationName.replaceAll(" ", "");
        List<String> gallery = new ArrayList<>();
        // Append random numbers to bypass browser caching for loremflickr
        Random rand = new Random();
        gallery.add("https://loremflickr.com/800/600/" + query + ",city?lock=" + rand.nextInt(1000));
        gallery.add("https://loremflickr.com/800/600/" + query + ",nature?lock=" + rand.nextInt(1000));
        gallery.add("https://loremflickr.com/800/600/" + query + ",food?lock=" + rand.nextInt(1000));
        gallery.add("https://loremflickr.com/800/600/" + query + ",people?lock=" + rand.nextInt(1000));
        return gallery;
    }
}
