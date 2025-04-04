@Service
public class ThresholdMonitorService {
    @Autowired
    private ThresholdRepository thresholdRepository;

    @Autowired
    private SlackService slackService;

    @Scheduled(fixedRate = 60000) // Runs every 60 seconds
    public void monitorThresholds() {
        List<Threshold> thresholds = thresholdRepository.findAll();
        for (Threshold threshold : thresholds) {
            if (threshold.isExceeded()) {
                slackService.sendNotification(threshold.getSupervisorSlackId(),
                        "Employee " + threshold.getEmployeeName() + " exceeded the threshold!");
            }
        }
    }
}
