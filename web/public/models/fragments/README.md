# Fragments runtime models

The room-view page federates the formal Lab Architecture and Lab MEP runtime models at `twin.html`. Each discipline remains an independent visibility layer.

```powershell
npm run bim:convert -- ".\models\ifc\Lab archi.ifc" .\web\public\models\fragments\Lab-archi.frag
npm run bim:convert -- ".\models\ifc\Lab mep.ifc" .\web\public\models\fragments\Lab-mep.frag
```

IFC remains the source of truth. Commit `.frag` files only when the deployment should ship the generated runtime model.
