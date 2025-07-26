# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

This project uses a Makefile for build commands:

- `make build` - Builds the project into the `./static` folder with production optimizations
- `make start` - Builds the testing realm and starts development server with watch mode  
- `make watch` - Alias for `make start`, starts development web server on https://localhost:7081
- `make test` - Runs all Jest tests with coverage
- `make test-watch` - Runs tests in watch mode; use `make test-watch TESTARGS='test/file.spec.ts'` for specific files
- `make build-testing-realm` - Builds the static testing realm for scenes
- `make sdk-watch` - Builds scenes and launches web server for the official Decentraland Explorer

The project uses esbuild for compilation, TypeScript for type checking, and Jest for testing.

## Project Architecture

This is the **hammurabi** project - a reference implementation of the Decentraland protocol using Babylon.js that runs entirely in web browsers. The project is educational/experimental and currently in proof-of-concept status.

### Core Architecture Components

**Scene Management (`src/lib/babylon/scene/`)**:
- `SceneContext` - Central class managing scene state, CRDT message processing, and entity lifecycle
- `BabylonEntity` - Wrapper around Babylon.js objects with component-based architecture
- WebWorker-based scene runtime for script execution isolation
- Hot reload support for local development

**Communications System (`src/lib/decentraland/communications/`)**:
- Multi-protocol adapter system supporting LiveKit, WebSocket rooms, and offline modes
- `CommsTransportWrapper` - Transport abstraction layer
- Position reporting and networked profile systems
- Local server connection for previews via gatekeeper service at `localhost:3000`

**CRDT Wire Protocol (`src/lib/decentraland/crdt-wire-protocol/`)**:
- Component-based entity system with conflict resolution
- Last-write-wins and grow-only-set data structures
- Message processing with quota-based cooperative scheduling
- Protocol buffer serialization

**SDK Components (`src/lib/decentraland/sdk-components/`)**:
- Transform, mesh renderer, GLTF container, animator components
- Avatar shape and customization system
- Pointer events, raycasts, and collision detection
- Material and billboard components with Babylon.js integration

### Key Technical Details

- Uses generational entity IDs with range-based access control
- Implements ADR-148 for frame processing and ADR-133 for main.crdt loading
- Scene boundary calculation for message prioritization based on distance
- Asset loading managed through centralized `AssetManager`
- Support for parcel-based coordinate systems and world positioning

### Testing Realm

The project includes a complete testing realm with scenes compiled using the Decentraland SDK. The realm can be run in both the custom Babylon implementation and the official Decentraland Explorer for compliance testing.