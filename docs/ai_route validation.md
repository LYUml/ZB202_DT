# ZB202 DT Route Validation Notes

This file records the short experiments to prepare before the group meeting. The goal is to compare routes with evidence rather than only a concept diagram.

## Route A: Web Dashboard + Simplified 3D Room

Validation target:
- Show the real ZB202 device list in the web frontend.
- Display mock latest values and status.
- Add a simplified 3D room where device markers show status inside the model.

Expected result:
- Best near-term demo route.
- Does not depend on Revit conversion.
- Suitable for phone, tablet, and lightweight web deployment.

## Route B: Revit -> xeokit BIM Viewer

Validation target:
- Export Revit model to IFC or a xeokit-supported pipeline.
- Check whether components can be selected, highlighted, hidden, and linked to `deviceId`.

Expected result:
- Strong candidate for web-based BIM digital twin.
- Requires model conversion and license review before deeper development.

## Route C: Revit -> Blender/Bonsai -> GLB -> Web

Validation target:
- Open exported IFC/FBX in Blender with Bonsai or related IFC tooling.
- Remove unnecessary detail, simplify materials, and export GLB/glTF.
- Check web loading performance and whether object names can be mapped to device IDs.

Expected result:
- Useful model-processing path when the frontend only needs a lightweight 3D shell plus backend data.
- BIM properties may be reduced, but deployment can be simpler.

## Route D: Revit / 3D Model -> Unity Digital Twin

Validation target:
- Import an exported model format such as FBX/IFC into Unity.
- Test whether live status can be shown in the scene through API-fed labels or colors.

Expected result:
- Strongest immersive visual route.
- Heavier than web-first options and less natural for dashboard/history/platform features.

## Current Recommendation

Use Route A as the immediate group-meeting demo path. Keep Routes B and C as the likely next-stage model paths. Treat Route D as an immersive-showcase option if the team wants to reuse existing Unity experience.
