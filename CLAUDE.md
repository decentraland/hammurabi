# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

### NPM Package Usage (Recommended)
The project is published as `@dcl/hammurabi-server` and runs the Decentraland protocol in headless mode using Babylon.js NullEngine:

```bash
# Run with default guest identity
npx @dcl/hammurabi-server start --realm=localhost:8000

# Run with custom wallet address
npx @dcl/hammurabi-server start --realm=localhost:8000 --address=0x123...

# Run as authenticated user
npx @dcl/hammurabi-server start --address=0x123... --authenticated
```

The CLI reuses the same `main()` function from `engine-main.ts`:
- **Headless mode**: `main({ identity: {...}, realm: {...} })` (no canvas = uses NullEngine)
- **Scene Runtime**: Automatically detects environment and uses:
  - **Browser**: WebWorker with isolated JavaScript execution
  - **Node.js**: Same WebWorker runtime logic but with MemoryTransport (no actual worker threads)

### Local Development CLI
For local development, use the `./hammurabi` executable:

- `./hammurabi start [realm=<url>]` - Start development server with optional realm
- `./hammurabi build` - Build production bundle into `./static` folder  
- `./hammurabi test [file=<path>] [--watch]` - Run tests with optional file filter and watch mode
- `./hammurabi sdk-watch` - Launch SDK development mode with official Decentraland Explorer

### Makefile Commands (used internally by CLI)
- `make build` - Builds the project with production optimizations
- `make dev` - Starts development server with watch mode on http://localhost:8099
- `make test` - Runs all Jest tests with coverage
- `make test-watch TESTARGS='test/file.spec.ts'` - Runs specific tests in watch mode
- `make build-testing-realm` - Builds the static testing realm for scenes
- `make update-snapshots` - Updates integration test snapshots

The project uses esbuild for compilation, TypeScript for type checking, and Jest for testing.

## Project Architecture

This is the **hammurabi** project - a reference implementation of the Decentraland protocol using Babylon.js that runs entirely in web browsers. The project serves as:
- Documentation of current and future protocol standards
- Experimental ground for protocol changes  
- Educational guide for new Decentraland contributors
- Prototyping platform for new features

**Current Status**: Proof of Concept

### Core Architecture Components

**Scene Management (`src/lib/babylon/scene/`)**:
- `SceneContext` - Central class managing scene state, CRDT message processing, and entity lifecycle
- `BabylonEntity` - Wrapper around Babylon.js objects with component-based architecture
- WebWorker-based scene runtime for script execution isolation
- Hot reload support for local development

**Communications System (`src/lib/decentraland/communications/`)**:
- Multi-protocol adapter system supporting LiveKit, WebSocket rooms, and offline modes
- `CommsTransportWrapper` - ADR-104 implementation for transport abstraction
- `AvatarCommunicationSystem` - Per-scene avatar management with profile caching
- `PlayerEntityManager` - Reserved entity allocation (entity 1 for local, 32-255 for remote players)
- Position reporting and multiplayer avatar systems
- Local server connection for previews via gatekeeper service at `localhost:3000`
- ADR-204 compliant profile fetching from Catalyst network with version announcements

**CRDT Wire Protocol (`src/lib/decentraland/crdt-wire-protocol/`)**:
- Component-based entity system with conflict resolution
- Last-write-wins and grow-only-set data structures
- Message processing with quota-based cooperative scheduling
- Protocol buffer serialization

**SDK Components (`src/lib/decentraland/sdk-components/`)**:
- Transform, mesh renderer, GLTF container, animator components
- Avatar system: `avatarShapeComponent` (SDK7 fake avatars) and `avatarBaseComponent` (multiplayer players)
- `playerIdentityDataComponent` for player identity information
- Pointer events, raycasts, and collision detection
- Material and billboard components with Babylon.js integration

### Key Technical Details

- **Entity Allocation**: Uses Unity-compatible reserved entity ranges (32-255 for remote players, 1 for local player)
- **Avatar Architecture**: Separate systems for SDK7 scene avatars vs real multiplayer players
- **Profile System**: ADR-204 compliant with Catalyst-based profile fetching and version announcements
- **Player Management**: `PlayerEntityManager` handles entity allocation/deallocation for multiplayer
- Implements ADR-148 for frame processing and ADR-133 for main.crdt loading
- Scene boundary calculation for message prioritization based on distance
- Asset loading managed through centralized `AssetManager`
- Support for parcel-based coordinate systems and world positioning

### Testing Realm

The project includes a complete testing realm with scenes compiled using the Decentraland SDK:
- Located in `testing-realm/` directory with pre-built scenes
- Scenes are exported using `sdk-commands export-static` to generate static files
- Can run in both the Babylon.js implementation and official Decentraland Explorer for compliance testing  
- WebSocket room configuration: `ws-room-service.decentraland.org/rooms/hammurabi`
- Static files served from `static/ipfs/` for scene content