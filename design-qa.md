# Design QA — Alarm panel

- Source visual truth: `/var/folders/wf/k5mwjp250qb5yyx7s8ddqw7m0000gn/T/TemporaryItems/NSIRD_screencaptureui_YL3QLC/截屏2026-09-07 22.20.08.png`
- Source pixels: 644 × 508
- Implementation screenshot: `/Users/lml/Desktop/ZB202_DT/alarm-implementation.png`
- Implementation pixels and CSS size: 275 × 206 at device density 1
- Comparison evidence: `/Users/lml/Desktop/ZB202_DT/alarm-comparison.png`
- Browser viewport: 919 × 793
- State: English dashboard, virtual debug data enabled, two active alarm records

## Findings

- Typography: passed. The hierarchy follows the sketch: panel title, two status headings, compact legends, then the alarm-information heading and rows.
- Spacing and layout rhythm: passed. The top status area is split equally; the lower list occupies the remaining width and height.
- Colors and tokens: passed. Existing dashboard tokens are retained; green, neutral, amber, and red communicate status consistently.
- Image and chart fidelity: passed. Two crisp, density-aware canvas donut charts reproduce the reference's ring charts without raster scaling artifacts.
- Copy and content: passed. `Alarm`, `Sensor status`, `Battery status`, and `Alarm information` match the reference structure while preserving the existing alert records.
- Interaction: passed. The alarm list is vertically scrollable when additional records exceed the available height.
- Console errors: none.

## Comparison history

1. Initial implementation showed only one alarm row above the fold, a P2 mismatch from the two-row reference.
2. Reduced the header/status tracks and chart size, tightened alarm-row height, and recaptured the component.
3. Post-fix evidence shows both alarm rows while preserving a working overflow scrollbar; no P0/P1/P2 issues remain.

Focused region comparison was used because the panel text and chart segments were too small to judge reliably in a full-dashboard screenshot.

final result: passed

---

# Design QA — Occupancy seat overlays

- Source visual truth: `C:\Users\lyuml\AppData\Local\Temp\codex-clipboard-e8e742e3-be76-49f8-959f-8c5bf54f6d40.png`
- Implementation: `http://127.0.0.1:5173/twin.html`
- Implementation screenshot: Codex in-app browser capture at 2026-09-07 23:11 Asia/Shanghai (tool-managed capture; no filesystem path)
- Viewport: 1274 × 984 CSS px at device density 1
- Source pixels: 1065 × 820
- Implementation pixels: 1274 × 984
- Normalization: compared the tabletop region at equivalent close-up scale; browser chrome and dashboard rails were excluded.
- State: clock double-click debug mode enabled; 7 of 12 seats occupied.

## Evidence and findings

- Full view: the implementation places a 2 × 6 grid directly on the detected rectangular Monza table. Only occupied seats render.
- Focused tabletop view: occupied seats use translucent blue fill, a crisp blue perimeter, and a centered circular blue person marker with a white ring.
- Typography: no new visible copy typography; accessible seat labels follow existing conventions.
- Spacing: the table bounds are evenly divided into two columns and six rows with consistent insets.
- Colors: blue fill, blue edge, white ring, and white person icon match the reference state treatment.
- Asset fidelity: the person symbol uses the installed Phosphor icon library; the overlay itself is native Three.js geometry.
- Copy/content: numbered accessible labels are present, and the dashboard occupancy value is `7 / 12` in debug mode.
- P3: CSS2D icons keep a fixed screen size, so extremely distant views compress spacing more than the close-up reference. A 30 px marker minimizes overlap in the default view.
- No actionable P0/P1/P2 differences remain.

## Interaction checks

- Debug on: seven blue occupied overlays appear and occupancy reads `7 / 12`.
- Debug off: all overlays hide and occupancy returns to unavailable.
- Orbit/zoom: overlays remain anchored to the table.
- Browser console: no errors or warnings observed.

## Comparison history

1. Initial pass generated no overlays because the IFC table name contains hyphens between all words.
2. Expanded the furniture-name matcher to accept the real IFC naming pattern.
3. Post-fix evidence showed 12 generated seat objects, seven visible occupied states, and zero visible states after debug mode was disabled.
4. Follow-up default-view review found the original single-pixel outline too subtle against the white tabletop.
5. Replaced it with four opaque blue frame meshes per occupied seat, raised the overlay above the tabletop, and disabled depth occlusion. The default dashboard view now visibly shows both blue fill and blue borders.

final result: passed
