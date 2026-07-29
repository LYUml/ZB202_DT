# DigitalHub FM-LFT v2 source

- Source: RWTH Aachen University, E3D, DigitalHub
- Repository: https://github.com/RWTH-E3D/DigitalHub
- Original path: `Version_2/DigitalHub_FM-LFT_v2.ifc`
- License: MIT
- IFC export: Autodesk Revit, IFC4 Reference View
- Downloaded: 2026-07-29
- IFC SHA-256: `C0A1807875957C4154D45D14A3B5ED480DD3178A5BDC3262302A7ECCF76D5CB1`
- Generated Fragment SHA-256: `1E41D82BBEF7FB9E7B9BEF2E507F71E820271D182E573BEF697E547D0069EAA3`

This is the ventilation (`LFT`, Lüftung) discipline model. A lightweight STEP scan found:

- 595 `IfcDuctSegment`
- 538 `IfcDuctFitting`
- 148 `IfcAirTerminal`
- 18 `IfcDamper`
- 2 `IfcFan`
- 2 `IfcCoil`
- supply air, exhaust air, outdoor air, and extract-air `IfcSystem` records

The downloaded IFC is retained as the semantic source. The `.frag` file under `web/public/models/fragments/` is the generated browser runtime asset.
