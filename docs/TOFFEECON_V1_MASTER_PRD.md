# 🎪 TOFFEECON 2026 — MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)

> **Venture Identity**: ToffeeCon 2026 Interactive Experience OS & Staging Engine  
> **Parent Ecosystem**: GRO10X Holdings (`D:\gro10x.ai`) · Engine 4 (Foundry 10X Product #1)  
> **Assigned Enterprise Client**: Toffee / Banglalink  
> **Workspace Path**: `D:\Toffeecon\`  
> **Author**: GRO10X Holdings Chief of Staff & Virtual CTO  
> **Status**: Production Staging Specification (V1.0)

---

## 1. Executive Summary & Event Mission

**ToffeeCon 2026** is an institutional-grade, real-time interactive event operating system designed for massive live conference activations, esports arenas, and broadcast entertainment summits.

It transforms physical exhibition halls into an interconnected digital gaming universe. Thousands of attendees interact with mobile gate entry portals, AI-powered voice dubbing booths, live talent audition recording stations, and interactive voting nodes, all synchronized in sub-50ms latency across 3-screen mainstage LED displays and immersive projection walls.

---

## 2. Core System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │             TOFFEECON 2026 EXPERIENCE OS               │
                                  │              (Express 5.2.1 + WebSockets)              │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
          ┌───────────────────────────────────────────────────┼───────────────────────────────────────────────────┐
          │                                                   │                                                   │
          ▼                                                   ▼                                                   ▼
┌───────────────────────────┐                       ┌───────────────────────────┐                       ┌───────────────────────────┐
│ 1. REAL-TIME EVENT CORE   │                       │ 2. EXPERIENTIAL HARDWARE  │                       │ 3. PERSISTENCE & TELEMETRY│
├───────────────────────────┤                       ├───────────────────────────┤                       ├───────────────────────────┤
│ • Express 5.2.1 (Port 5000│                       │ • 3-Screen Mainstage LED  │                       │ • Crash-Proof State Engine│
│ • WebSocket Server (ws)   │                       │ • Space Wall Projection   │                       │   (server/data/*.json)    │
│   Room Pub/Sub Broadcast  │                       │ • Immersive Space Ceiling │                       │ • Audit Logs & Event Sinks│
│ • Universal XSS Sanitizer │                       │ • Space Window & Wall     │                       │ • Live Diagnostics API    │
│ • Process Protection Guard│                       │ • Kiosks & Booth Screens  │                       │   (/api/system/diagnos..) │
└───────────────────────────┘                       └───────────────────────────┘                       └───────────────────────────┘
```

---

## 3. Experiential Booth & Screen Inventory (33 Public Views)

All public interactive experiences reside in `client/public/`:

### A. Stage & Main Attraction Displays
1. **`/stage` (`stage.html`)**: 3-screen mainstage synchronized LED broadcast view.
2. **`/marathon-stage` (`marathon-stage.html`)**: Live competition leaderboard and countdown.
3. **`/universe-wall` (`universe-wall.html`)**: Visualized universe constellation map.
4. **`/space-wall`, `/space-ceiling`, `/space-window`**: Multi-display ambient room immersive video canvas.

### B. Interactive Attendee Booths
5. **`/audition-booth` (`audition-booth.html`)**: Live camera recording and talent audition capture.
6. **`/dub-booth` (`dub-booth.html`)**: AI voice dubbing over iconic movie clips.
7. **`/capsule-booth` (`capsule-booth.html`)**: Digital time-capsule message recording.
8. **`/casting-curator` (`casting-curator.html`)**: Judge and casting director review station.
9. **`/universe-kiosk` (`universe-kiosk.html`)**: Touchscreen attendee universe profile generator.

### C. Attendee Mobile Companion & Voting
10. **`/gate` (`gate.html`)**: Entry gate registration, badge scan, and QR token validator.
11. **`/vote` (`vote.html`)**: Real-time audience voting and live polling.
12. **`/portal` (`portal.html`)**: Attendee personal mobile companion app.
13. **`/greetings` (`greetings.html`)**: Welcome portal and personalized greeting card generator.

### D. Mission Control & Directing
14. **`/hub` (`hub.html`) / `/mission-control` (`mission-control.html`)**: Master event directing console.
15. **`/presenter-remote` (`presenter-remote.html`)**: Stage presenter handheld remote control.
16. **`/screen-relay` (`screen-relay.html`)**: Multi-device hardware screen relay monitor.

---

## 4. Backend Routing & State Stores

```
server/
├── server.js               # Entry point (Port 5000, WebSockets, XSS security)
├── routes/
│   ├── boothRoutes.js      # Audition, Dubbing, Capsule booth submissions
│   ├── stageRoutes.js      # Stage transitions, LED triggers, and cue points
│   ├── voteRoutes.js       # Real-time poll casting and tallying
│   ├── gateRoutes.js       # RSVP registration, badge verification
│   └── systemRoutes.js     # Live diagnostics, network discovery, wall sync
├── services/
│   ├── eventStore.js       # Crash-proof state hydration & atomic disk flush
│   └── aiProvider.js       # Google Gemini AI multimodal integration
└── stores/
    ├── castingStore.js     # Talent submissions & judge scoring
    ├── dubStore.js         # Voice dub tracks & media clips
    ├── marathonStore.js    # Esports/marathon live team telemetry
    ├── proposalStore.js    # Pitch deck slides & sponsor proposals
    ├── spaceStore.js       # Projection wall states & color themes
    └── universeStore.js    # Attendee avatar generation & constellation data
```

---

## 5. Mother OS Satellite Bridge Integration

ToffeeCon connects as **Product #1** under **GRO10X Foundry 10X (Engine 4)** in `D:\gro10x.ai`:
* **Port**: Runs on **`PORT=5000`**.
* **Diagnostics Path**: `GET /api/system/diagnostics` returning:
  * `uptimeSeconds`: Process uptime.
  * `memoryUsage`: Real-time heap and RSS allocations.
  * `connectedClients`: Total live connected WebSockets across all booths and phones.
  * `autoLoopActive`: True if autonomous loop triggers are active.
  * `eventState`: Snapshot of current active stage mode.
* **Mother OS Service**: `D:\gro10x.ai\src\services\toffeecon-bridge.js`.
