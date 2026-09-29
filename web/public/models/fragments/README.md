# Fragments runtime models

The room-view page federates the formal Lab Architecture, Lab MEP, and Sensor runtime models at `twin.html`. Each model remains an independent visibility layer.

```powershell
npm run bim:convert -- ".\models\ifc\lab-archi.ifc" .\web\public\models\fragments\Lab-archi.frag
npm run bim:convert -- ".\models\ifc\lab-mep.ifc" .\web\public\models\fragments\Lab-mep.frag
npm run bim:convert -- ".\models\ifc\lab-sensor.ifc" .\web\public\models\fragments\Sensor.frag
```

IFC remains the source of truth. Commit `.frag` files only when the deployment should ship the generated runtime model.
