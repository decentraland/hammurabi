#! /usr/bin/env bash

# This script generates a file with all the first party dependencies and places
# it in src/explorer/dependencies.ts

grep -E --no-filename --exclude src/explorer/dependencies.ts -R '^import.*@dcl/.*$' src \
  | sed 's/import/export/g' \
  | sed 's/;$//g' \
  | sed s/\"/\'/g \
  | sort -u \
  | node -e "const lines = fs.readFileSync(0, 'utf8').split('\n');
    const result = lines.map(line => {
        if (!line.includes('{')) return line
        const source = line.match(/from '(.*)'/)[1];
        const elements = line.match(/\{(.*)\}/)[1]; 
        return elements.split(',').map(element => 'export { ' + element.trim() + ' } from \'' + source + '\'')
    })
    fs.writeFileSync(1, result.flat().join('\n'))" \
  | sort -u \
  > src/explorer/dependencies.ts