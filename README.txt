BOMBER TANKS ONLINE — STARTER PACKAGE (tablet-friendly deployment)

FILES
- index.html: your existing Bomber Tanks game, with a connection badge and join-position sync.
- server.js: Node.js + Socket.IO server for online player presence, tank position/direction/lives updates, and bomb-drop visuals.
- package.json: server dependencies and start command.

WHAT THIS VERSION SYNCS
- Online connection status and current online player count
- Joining / disconnecting players
- Tank positions and directions when moving
- Bomb-drop events (visuals on other clients)

IMPORTANT LIMITATIONS
- This is a multiplayer foundation, not yet a fully authoritative competitive game.
- Damage, explosion results, enemy AI, inventory, login, gold, purchases, chat, and account data are not server-authoritative or shared between devices.
- The current game's account and currency information uses browser-local storage. It is not a secure online account system. Do not use this version for real-money transactions or valuable balances.
- The game will NOT work online by opening the HTML from a local content:// URL. You must open the hosted HTTPS website served by this Node.js app.

HOW TO RUN ON A NODE.JS HOST
1. Upload/extract all three files to a Node.js web service that supports WebSockets.
2. Build/install command: npm install
3. Start command: npm start
4. Set the host's port to use the PORT environment variable (most hosts do this automatically).
5. Open the deployed HTTPS URL on two separate devices and press Play in both.
6. The badge should say SERVER: CONNECTED and show the online count.

HEALTH CHECK
Open /health on the deployed URL. A JSON response with ok:true means the server process is responding.

Before publishing to real players, the game needs a second development pass for server-authoritative combat, collision/damage, secure accounts, and shared persistence.
