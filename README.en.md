# ZB202 Digital Twin

A digital twin for ZB202 lab monitoring. The frontend displays BIM models and sensor readings; a local bridge supplies live data from InfluxDB.

## Run

Requires Node.js 20.19+. In the project directory:

```sh
npm install
cp .env.example .env
npm run dev
```

Add the InfluxDB token and connection details to `.env`. On Windows, launch `start-zb202.bat`; on macOS, use `start-zb202.command`.

Open `http://127.0.0.1:5173/overview.html` for the overview or `http://127.0.0.1:5173/twin.html` for the 3D twin.

## Commands

- `npm run build`: build the static pages
- `npm run test:bridge`: check the data bridge
- `npm run bim:convert`: convert IFC to Fragments

Keep `.env` local and never commit real credentials.
