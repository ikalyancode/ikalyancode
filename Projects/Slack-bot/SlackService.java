@Service
public class SlackService {
    private static final String SLACK_API_URL = "https://slack.com/api/chat.postMessage";
    private static final String AUTH_TOKEN = "xoxb-slack-bot-token";

    public void sendNotification(String slackUserId, String message) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + AUTH_TOKEN);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> payload = new HashMap<>();
        payload.put("channel", slackUserId);
        payload.put("text", message);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
        restTemplate.postForEntity(SLACK_API_URL, request, String.class);
    }
}
