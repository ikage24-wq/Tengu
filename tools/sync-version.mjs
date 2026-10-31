// Copies package.json's version into src/version.js, so the title screen shows the version the
// desktop app was built as. `npm version patch|minor|major` runs this (see package.json).
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const file = new URL('../src/version.js', import.meta.url);
writeFileSync(file, readFileSync(file, 'utf8').replace(/VERSION = '[^']*'/, `VERSION = '${version}'`));
console.log(`version ${version}`);
