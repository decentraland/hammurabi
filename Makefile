ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

install: node_modules testing-realm/node_modules

# the URL in which the content will be served. this is necessary to build the testing-realm
CF_PAGES_URL ?= http://localhost:8099

node_modules: package-lock.json package.json
	@echo "~ Installing dependencies..."
	@npm install >> install-log.txt
	@echo "~ Dependencies installed."

testing-realm/node_modules: testing-realm/package-lock.json testing-realm/package.json
	@echo "~ Installing dependencies for scenes..."
	@cd testing-realm; npm install >> build-log.txt
	@echo "~ Scene dependencies installed."

test:
	@echo "~ Running tests..."
	@node_modules/.bin/jest --detectOpenHandles --colors --runInBand $(TESTARGS) --coverage

update-snapshots: testing-realm/node_modules
	@UPDATE_SNAPSHOTS=true make test TESTARGS=test/integration/*.ts
	@echo "~ Test snapshot data updated."

test-watch:
	@echo "~ Running tests in watchmode..."
	@node_modules/.bin/jest --detectOpenHandles --colors --runInBand --watch $(TESTARGS)

src/explorer/avatar-scene.json: testing-realm/node_modules testing-realm/avatars-scene/**/*
	@echo "~ Building avatar scenes..."
	@cd testing-realm/avatars-scene; npm run build
	@cd testing-realm/avatars-scene; \
		../node_modules/.bin/sdk-commands export-static \
			--destination ../../static/ipfs \
			--timestamp 1683892881318 \
			--json > ../../src/explorer/avatar-scene.json \
			--baseUrl=$(CF_PAGES_URL)/ipfs
	@sync
	@echo "~ Avatar scene built."

build-testing-realm: testing-realm/node_modules src/explorer/avatar-scene.json
	@echo "~ Building test scenes..."
	@cd testing-realm; npm run build
	@cd testing-realm; \
		node_modules/.bin/sdk-commands export-static \
			--destination ../static/ipfs \
			--realmName testing-realm \
			--timestamp 1683892881318 \
			--commsAdapter ws-room:ws-room-service.decentraland.org/rooms/hammurabi \
			--baseUrl=$(CF_PAGES_URL)/ipfs
	@echo "~ Test scenes built."

sdk-watch: testing-realm/node_modules
	@cd testing-realm; npm run start

src/explorer/dependencies.ts: src/lib/**/*ts
	@echo "~ Analyzing first party dependencies..."
	@bash scripts/build-first-party-deps.sh
	@echo "~ First party dependencies file 'src/explorer/dependencies.ts' updated."

build: node_modules build-testing-realm src/explorer/dependencies.ts
	@echo "~ Running build..."
	@node ./build.js --production
	@echo "~ Typechecking tests..."
	@node_modules/.bin/tsc --project test/tsconfig.json
	@echo "Build finished"

start: node_modules build-testing-realm src/explorer/dependencies.ts
	@node ./build.js --watch

.PHONY: build test install start sdk-watch build-testing-realm update-snapshots test-watch 
