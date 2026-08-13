# IFC source models

Export coordinated BIM models from Revit to this folder as IFC. IFC files are the semantic source of truth and should preserve stable `GlobalId` values between revisions.

The formal federated model consists of `Lab archi.ifc`, `Lab mep.ifc`, and `Sensor.ifc`. Convert all three with:

```powershell
npm run bim:convert -- ".\models\ifc\Lab archi.ifc" .\web\public\models\fragments\Lab-archi.frag
npm run bim:convert -- ".\models\ifc\Lab mep.ifc" .\web\public\models\fragments\Lab-mep.frag
npm run bim:convert -- ".\models\ifc\Sensor.ifc" .\web\public\models\fragments\Sensor.frag
```
