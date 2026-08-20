@echo off
cd /d "%~dp0.."
set "ZB202_INFLUX_BRIDGE_HOST=0.0.0.0"
npm.cmd run influx:bridge
