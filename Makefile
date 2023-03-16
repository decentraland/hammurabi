ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

install: node_modules example-scene/node_modules

node_modules: package-lock.json package.json
	npm install

example-scene/node_modules: example-scene/package-lock.json example-scene/package.json
	cd example-scene; npm install

test:
	@echo "~ Running tests..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand $(TESTARGS) --coverage

test-watch:
	@echo "~ Running tests in watchmode..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand --watch $(TESTARGS)

build-example-scene: example-scene/node_modules
	cd example-scene; npm run build
	cd example-scene; \
		node_modules/.bin/sdk-commands export-static \
			--destination ../static/ipfs --json > ../static/scene-info.json

build: node_modules build-example-scene
	@echo "~ Running build..."
	@node ./build.js --production

start: build-example-scene
	node ./build.js --watch

.PHONY: build test