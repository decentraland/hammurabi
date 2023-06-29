ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

install: node_modules testing-realm/node_modules 2&>> build-log.txt

# the URL in which the content will be served. this is necessary to build the testing-realm
CF_PAGES_URL ?= http://localhost:8099

node_modules: package-lock.json package.json
	@echo "~ Installing dependencies..."
	@npm install 2&> build-log.txt

testing-realm/node_modules: testing-realm/package-lock.json testing-realm/package.json
	@echo "~ Installing dependencies for scenes..."
	@cd testing-realm; npm install 2&> build-log.txt

test:
	@echo "~ Running tests..."
	@node_modules/.bin/jest --detectOpenHandles --colors --runInBand $(TESTARGS) --coverage

update-snapshots: build-testing-realm
	@UPDATE_SNAPSHOTS=true make test TESTARGS=test/integration/*.ts

test-watch:
	@echo "~ Running tests in watchmode..."
	@node_modules/.bin/jest --detectOpenHandles --colors --runInBand --watch $(TESTARGS)

build-testing-realm: testing-realm/node_modules avatars-scene
	@echo "~ Building test scenes..."
	@cd testing-realm; \
		node_modules/.bin/sdk-commands export-static \
			--destination ../static/ipfs \
			--realmName testing-realm \
			--timestamp 1683892881318 \
			--commsAdapter ws-room:ws-room-service.decentraland.org/rooms/hammurabi \
			--baseUrl=$(CF_PAGES_URL)/ipfs 2&> build-log.txt

avatars-scene: testing-realm/node_modules
	@echo "~ Building avatar scenes..."
	@cd testing-realm/avatars-scene; npm run build 2&> build-log.txt
	@cd testing-realm/avatars-scene; \
		../node_modules/.bin/sdk-commands export-static \
			--destination ../../static/ipfs \
			--timestamp 1683892881318 \
			--json > ../../src/explorer/avatar-scene.json \
			--baseUrl=$(CF_PAGES_URL)/ipfs 2&> build-log.txt

sdk-watch: testing-realm/node_modules
	@cd testing-realm; npm run start

src/explorer/dependencies.ts: src/**/*.ts
	@echo "~ Analyzing first party dependencies..."
	@bash scripts/build-first-party-deps.sh

build: node_modules build-testing-realm src/explorer/dependencies.ts
	@echo "~ Running build..."
	@node ./build.js --production
	@echo "~ Typechecking tests..."
	@node_modules/.bin/tsc --project test/tsconfig.json
	@echo "Build finished"

start: node_modules build-testing-realm src/explorer/dependencies.ts
	@node ./build.js --watch

.PHONY: build test
