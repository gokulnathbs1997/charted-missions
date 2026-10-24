#!/usr/bin/env sh
# Starts the online multiplayer server (needs Node.js 18+ from https://nodejs.org).
# Everyone on your network opens the "Friends on LAN" address it prints.
cd "$(dirname "$0")"
node server/server.mjs
