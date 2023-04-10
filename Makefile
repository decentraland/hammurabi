ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

install: node_modules testing-realm/node_modules

# the URL in which the content will be served. this is necessary to build the testing-realm
CF_PAGES_URL ?= 'http://localhost:8099'

node_modules: package-lock.json package.json
	npm install

testing-realm/node_modules: testing-realm/package-lock.json testing-realm/package.json
	cd testing-realm; npm install

test:
	@echo "~ Running tests..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand $(TESTARGS) --coverage

update-snapshots: build-testing-realm
	UPDATE_SNAPSHOTS=true make test TESTARGS=test/integration/*.ts

test-watch:
	@echo "~ Running tests in watchmode..."
	node_modules/.bin/jest --detectOpenHandles --colors --runInBand --watch $(TESTARGS)

build-testing-realm: testing-realm/node_modules
	cd testing-realm; npm run build
	cd testing-realm; \
		node_modules/.bin/sdk-commands export-static \
			--destination ../static/ipfs \
			--realmName testing-realm \
			--baseUrl=$(CF_PAGES_URL)/ipfs

sdk-watch: testing-realm/node_modules
	cd testing-realm; npm run start

build: node_modules build-testing-realm
	@echo "~ Running build..."
	@node ./build.js --production

start: build-testing-realm
	node ./build.js --watch

.PHONY: build test