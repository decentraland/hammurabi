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

build: node_modules
	@echo "~ Running build..."
	@node ./build.js --production
	@echo "~ Running typechecker..."
	@node_modules/.bin/tsc -p tsconfig.json

start:
	node ./build.js --watch

.PHONY: build test