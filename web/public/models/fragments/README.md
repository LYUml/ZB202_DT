# Fragments runtime models

Place generated `.frag` files here. The existing room-view page loads the open-source DigitalHub ventilation model by default at `twin.html`.

```powershell
npm run bim:convert -- .\models\ifc\DigitalHub_FM-LFT_v2.ifc .\web\public\models\fragments\DigitalHub_FM-LFT_v2.frag
```

IFC remains the source of truth. Commit `.frag` files only when the deployment should ship the generated runtime model.
