package com.openshelfrating.backend.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openshelfrating.backend.catalog.config.OpenLibraryProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OpenLibraryClient {

    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private static final Logger log = LoggerFactory.getLogger(OpenLibraryClient.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final OpenLibraryProperties properties;
    private final Map<String, CachedValue<List<ExternalBookCandidate>>> cache = new ConcurrentHashMap<>();

    public OpenLibraryClient(OpenLibraryProperties properties) {
        this.objectMapper = new ObjectMapper();
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMillis()))
                .build();
    }

    public List<ExternalBookCandidate> searchByIsbn(String isbn) {
        if (isbn == null || isbn.isBlank()) {
            return List.of();
        }

        String cacheKey = "isbn:" + isbn;
        List<ExternalBookCandidate> cached = getCached(cacheKey);
        if (cached != null) {
            return cached;
        }

        String encodedIsbn = URLEncoder.encode(isbn, StandardCharsets.UTF_8);
        String url = properties.getBaseUrl() + "/api/books?bibkeys=ISBN:" + encodedIsbn + "&format=json&jscmd=data";

        JsonNode root = getJsonWithRetry(url);
        if (root == null || root.isEmpty()) {
            putCache(cacheKey, List.of());
            return List.of();
        }

        List<ExternalBookCandidate> results = new ArrayList<>();
        JsonNode firstBook = root.elements().next();
        ExternalBookCandidate candidate = mapIsbnBook(firstBook);
        if (candidate != null) {
            results.add(candidate);
        }

        putCache(cacheKey, results);
        return results;
    }

    public List<ExternalBookCandidate> searchByTitle(String title, int limit) {
        if (title == null || title.isBlank()) {
            return List.of();
        }

        String safeTitle = title.trim();
        int safeLimit = Math.max(1, Math.min(limit, 10));
        String cacheKey = "title:" + safeTitle.toLowerCase(Locale.ROOT) + ":" + safeLimit;
        List<ExternalBookCandidate> cached = getCached(cacheKey);
        if (cached != null) {
            return cached;
        }

        String encodedTitle = URLEncoder.encode(safeTitle, StandardCharsets.UTF_8);
        String url = properties.getBaseUrl() + "/search.json?title=" + encodedTitle + "&limit=" + safeLimit;

        JsonNode root = getJsonWithRetry(url);
        if (root == null || root.isEmpty()) {
            putCache(cacheKey, List.of());
            return List.of();
        }

        JsonNode docs = root.path("docs");
        if (!docs.isArray()) {
            putCache(cacheKey, List.of());
            return List.of();
        }

        List<ExternalBookCandidate> results = new ArrayList<>();
        for (JsonNode doc : docs) {
            ExternalBookCandidate candidate = mapSearchDoc(doc);
            if (candidate != null) {
                results.add(candidate);
            }
            if (results.size() >= safeLimit) {
                break;
            }
        }

        putCache(cacheKey, results);
        return results;
    }

    private JsonNode getJsonWithRetry(String url) {
        int attempts = 0;
        RuntimeException lastError = null;

        while (attempts < 3) {
            attempts++;
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofMillis(properties.getTimeoutMillis()))
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode parsed = objectMapper.readTree(response.body());
                    // Requested trace: keep raw Open Library payload visible in server logs.
                    log.info("OpenLibrary payload from {}: {}", url, response.body());
                    return parsed;
                }

                lastError = new OpenLibraryUnavailableException(
                        "Open Library returned status " + response.statusCode()
                );
            } catch (IOException | InterruptedException e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                lastError = new OpenLibraryUnavailableException("Open Library request failed", e);
            }
        }

        throw lastError != null ? lastError : new OpenLibraryUnavailableException("Open Library unavailable");
    }

    private ExternalBookCandidate mapIsbnBook(JsonNode bookNode) {
        String title = textOrNull(bookNode.path("title"));
        if (title == null) {
            return null;
        }

        List<String> authors = readArrayStrings(bookNode.path("authors"), "name");
        String primaryAuthor = authors.isEmpty() ? "Unknown" : authors.get(0);
        List<String> otherAuthors = authors.size() > 1 ? authors.subList(1, authors.size()) : List.of();

        JsonNode identifiers = bookNode.path("identifiers");
        String isbn13 = firstArrayString(identifiers.path("isbn_13"));
        String isbn10 = firstArrayString(identifiers.path("isbn_10"));

        String publisher = firstArrayString(bookNode.path("publishers"), "name");
        LocalDate publicationDate = parseDate(textOrNull(bookNode.path("publish_date")));
        Integer pages = bookNode.path("number_of_pages").isNumber() ? bookNode.path("number_of_pages").asInt() : null;
        String language = extractLanguageFromData(bookNode.path("languages"));

        List<String> subjects = readArrayStrings(bookNode.path("subjects"), "name");
        String coverUrl = extractCoverUrl(bookNode.path("cover"));
        String externalSourceId = textOrNull(bookNode.path("url"));

        return new ExternalBookCandidate(
                title,
                primaryAuthor,
                otherAuthors,
                isbn13,
                isbn10,
                publisher,
                publicationDate,
                pages,
                language,
                subjects,
                coverUrl,
                externalSourceId
        );
    }

    private ExternalBookCandidate mapSearchDoc(JsonNode docNode) {
        String title = textOrNull(docNode.path("title"));
        if (title == null) {
            return null;
        }

        List<String> authors = readArrayStrings(docNode.path("author_name"));
        String primaryAuthor = authors.isEmpty() ? "Unknown" : authors.get(0);
        List<String> otherAuthors = authors.size() > 1 ? authors.subList(1, authors.size()) : List.of();

        List<String> isbns = readArrayStrings(docNode.path("isbn"));
        String isbn13 = isbns.stream().filter(v -> v != null && v.matches("\\d{13}")).findFirst().orElse(null);
        String isbn10 = isbns.stream().filter(v -> v != null && v.matches("\\d{9}[\\dX]"))
                .findFirst().orElse(null);

        Integer firstPublishYear = docNode.path("first_publish_year").isNumber()
                ? docNode.path("first_publish_year").asInt()
                : null;
        LocalDate publicationDate = firstPublishYear == null ? null : LocalDate.of(firstPublishYear, 1, 1);

        String language = firstArrayString(docNode.path("language"));
        if (language != null && language.length() > 3) {
            language = language.substring(0, 3);
        }

        List<String> subjects = readArrayStrings(docNode.path("subject"));
        String coverUrl = buildCoverUrl(docNode.path("cover_i"));
        String externalSourceId = textOrNull(docNode.path("key"));

        return new ExternalBookCandidate(
                title,
                primaryAuthor,
                otherAuthors,
                isbn13,
                isbn10,
                null,
                publicationDate,
                null,
                language,
                subjects,
                coverUrl,
                externalSourceId
        );
    }

    private String extractLanguageFromData(JsonNode languageNode) {
        if (!languageNode.isArray() || languageNode.isEmpty()) {
            return null;
        }

        JsonNode first = languageNode.get(0);
        String key = textOrNull(first.path("key"));
        if (key == null) {
            return null;
        }

        int idx = key.lastIndexOf('/');
        if (idx >= 0 && idx + 1 < key.length()) {
            return key.substring(idx + 1);
        }

        return key;
    }

    private String buildCoverUrl(JsonNode coverIdNode) {
        if (!coverIdNode.isNumber()) {
            return null;
        }
        return "https://covers.openlibrary.org/b/id/" + coverIdNode.asInt() + "-M.jpg";
    }

    private String extractCoverUrl(JsonNode coverNode) {
        if (!coverNode.isObject()) {
            return null;
        }
        String large = textOrNull(coverNode.path("large"));
        if (large != null) {
            return large;
        }
        String medium = textOrNull(coverNode.path("medium"));
        if (medium != null) {
            return medium;
        }
        return textOrNull(coverNode.path("small"));
    }

    private List<String> readArrayStrings(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        for (JsonNode child : node) {
            String value = textOrNull(child);
            if (value != null) {
                values.add(value);
            }
        }
        return values;
    }

    private List<String> readArrayStrings(JsonNode node, String field) {
        if (!node.isArray()) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        for (JsonNode child : node) {
            String value = textOrNull(child.path(field));
            if (value != null) {
                values.add(value);
            }
        }
        return values;
    }

    private String firstArrayString(JsonNode node) {
        if (!node.isArray() || node.isEmpty()) {
            return null;
        }
        return textOrNull(node.get(0));
    }

    private String firstArrayString(JsonNode node, String field) {
        if (!node.isArray() || node.isEmpty()) {
            return null;
        }
        return textOrNull(node.get(0).path(field));
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String normalized = raw.trim();
        if (normalized.matches("\\d{4}")) {
            return LocalDate.of(Integer.parseInt(normalized), 1, 1);
        }

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("MMMM d, uuuu", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMM d, uuuu", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMMM uuuu", Locale.ENGLISH)
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                if ("MMMM uuuu".equals(formatter.toString())) {
                    continue;
                }
                return LocalDate.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
                // try next format
            }
        }

        if (normalized.matches("[A-Za-z]+\\s+\\d{4}")) {
            String[] parts = normalized.split("\\s+");
            return LocalDate.of(Integer.parseInt(parts[1]), 1, 1);
        }

        return null;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private List<ExternalBookCandidate> getCached(String key) {
        CachedValue<List<ExternalBookCandidate>> cached = cache.get(key);
        if (cached == null) {
            return null;
        }
        if (cached.isExpired()) {
            cache.remove(key);
            return null;
        }
        return cached.value();
    }

    private void putCache(String key, List<ExternalBookCandidate> value) {
        List<ExternalBookCandidate> immutable = value == null ? List.of() : Collections.unmodifiableList(new ArrayList<>(value));
        cache.put(key, new CachedValue<>(immutable));
    }

    private record CachedValue<T>(T value, long createdAtMillis) {
        private CachedValue(T value) {
            this(value, System.currentTimeMillis());
        }

        private boolean isExpired() {
            return System.currentTimeMillis() - createdAtMillis > CACHE_TTL.toMillis();
        }
    }

    public record ExternalBookCandidate(
            String title,
            String primaryAuthor,
            List<String> otherAuthors,
            String isbn13,
            String isbn10,
            String publisher,
            LocalDate publicationDate,
            Integer pages,
            String language,
            List<String> subjects,
            String coverUrl,
            String externalSourceId
    ) {
    }

    public static class OpenLibraryUnavailableException extends RuntimeException {
        public OpenLibraryUnavailableException(String message) {
            super(message);
        }

        public OpenLibraryUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
