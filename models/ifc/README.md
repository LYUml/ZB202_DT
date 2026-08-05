# IFC source models

Export coordinated BIM models from Revit to this folder as IFC. IFC files are the semantic source of truth and should preserve stable `GlobalId` values between revisions.

The formal federated model consists of `Lab archi.ifc` and `Lab mep.ifc`. Convert both with:

```powershell
npm run bim:convert -- ".\models\ifc\Lab archi.ifc" .\web\public\models\fragments\Lab-archi.frag
npm run bim:convert -- ".\models\ifc\Lab mep.ifc" .\web\public\models\fragments\Lab-mep.frag
```
