# IFC source models

Export coordinated BIM models from Revit to this folder as IFC. IFC files are the semantic source of truth and should preserve stable `GlobalId` values between revisions.

The current repository does not yet contain an IFC export. Convert one with:

```powershell
npm run bim:convert -- .\models\ifc\ZN1001.ifc .\web\public\models\fragments\ZN1001.frag
```
