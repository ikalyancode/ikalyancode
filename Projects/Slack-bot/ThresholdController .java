@RestController
@RequestMapping("/api/thresholds")
public class ThresholdController {
    @Autowired
    private ThresholdService thresholdService;

    @PostMapping
    public ResponseEntity<String> setThreshold(@RequestBody ThresholdRequest request) {
        thresholdService.setThreshold(request);
        return ResponseEntity.ok("Threshold set successfully");
    }
}
