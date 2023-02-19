ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

install: node_modules

node_modules: package-lock.json package.json
	npm ci

test:
	@echo "~ Running tests..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand $(TESTARGS) --coverage

test-watch:
	@echo "~ Running tests in watchmode..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand --watch $(TESTARGS)

test-scene/node_modules: test-scene/yarn.lock test-scene/package.json
	cd test-scene; yarn install

scene-built: test-scene/node_modules
	cd test-scene; yarn run build
	cd test-scene; node_modules/.bin/sdk-commands export-static --destination ../static/ipfs --json > ../src/scene-info.json

build: node_modules scene-built
	@echo "~ Running build..."
	@node ./build.js --production
	@echo "~ Running typechecker..."
	@node_modules/.bin/tsc -p tsconfig.json

start:
	node ./build.js --watch

.PHONY: build test