# A Babylon.js explorer

This repository is the compation material for the implementation guide (still work in progress).

The artifact of the build of this site is a static web application implementing a fully compliant explorer for the Decentraland protocol.

This is a work in progress.

# How to develop

This repository uses Makefile to declare all available commands and it also uses `yarn` to manage the NPM packages.

- `make build` builds the project into the `./static` folder.
- `make watch` starts a web server and watches for changes in the sources of the project.
- `make test` executes all the tests
- `make test-watch` executes all the tests and watches for file changes to run the tests again
- `make test-watch TESTARGS='test/file.spec.ts'` runs the tests of `test/file.spec.ts`