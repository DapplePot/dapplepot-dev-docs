#!/usr/bin/env node
/**
 * Regenerates src/data/apiReference.generated.json from the pinned
 * dapplepot-sdk version in sdk-version.json.
 *
 * Installs the pinned dapplepot-sdk version (plain, no extras — it has no
 * idea it's being documented) plus docstring_parser into a throwaway
 * venv, then runs scripts/docgen.py (lives in THIS repo, not the SDK) to
 * introspect it and print the API reference JSON.
 *
 * Runs on every `npm run build` / `npm run dev` via package.json's
 * prebuild/predev hooks, so the API Reference page always reflects
 * whatever SDK version is currently pinned — see sdk-version.json to
 * bump it, and the "Dev-docs auto-sync operations" section of
 * dapplepot-internal-docs/sdk_internal_docs.md for the full operating
 * procedure.
 *
 * For local development against an unreleased SDK checkout, set
 * DAPPLEPOT_SDK_LOCAL_PATH to a local dapplepot-sdk directory instead of
 * installing from the pinned git tag.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENV_DIR = join(ROOT, '.venv-docgen');
const OUT_PATH = join(ROOT, 'src', 'data', 'apiReference.generated.json');
const isWindows = process.platform === 'win32';
const venvPython = join(VENV_DIR, isWindows ? 'Scripts\\python.exe' : 'bin/python');

function sh(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  return execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function shCapture(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf-8', ...opts });
}

function commandWorks(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// `python3` doesn't exist on most Windows installs — only `python`, or (worse)
// the Microsoft Store's app-execution-alias stub, which "exists" on PATH but
// exits with an error telling you to install from the Store. Try candidates
// in the order most likely to be a real interpreter on each platform and use
// the first one that actually runs, instead of assuming a single name.
function resolveBasePython() {
  const candidates = isWindows
    ? [['py', ['-3']], ['python', []], ['python3', []]]
    : [['python3', []], ['python', []]];
  for (const [cmd, baseArgs] of candidates) {
    if (commandWorks(cmd, [...baseArgs, '--version'])) {
      return { cmd, baseArgs };
    }
  }
  throw new Error(
    'Could not find a working Python 3 interpreter. Tried: ' +
    candidates.map(([cmd, baseArgs]) => [cmd, ...baseArgs].join(' ')).join(', ') +
    '. Install Python 3.10+ and make sure it is on PATH.'
  );
}

function main() {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'sdk-version.json'), 'utf-8'));
  const localPath = process.env.DAPPLEPOT_SDK_LOCAL_PATH;

  if (!existsSync(venvPython)) {
    console.log(`Creating docgen venv at ${VENV_DIR}...`);
    const { cmd, baseArgs } = resolveBasePython();
    sh(cmd, [...baseArgs, '-m', 'venv', VENV_DIR]);
  }

  // dapplepot-sdk itself carries no docs-generation code or dependencies —
  // that's all in this repo (scripts/docgen.py). We just need the bare
  // package installed so docgen.py can `import dapplepot_sdk`.
  const target = localPath
    ? `dapplepot-sdk @ file://${localPath}`
    : `dapplepot-sdk @ git+https://github.com/DapplePot/dapplepot-sdk@v${version}`;

  console.log(
    localPath
      ? `Installing dapplepot-sdk from local path ${localPath} (DAPPLEPOT_SDK_LOCAL_PATH set)`
      : `Installing dapplepot-sdk @ v${version} from GitHub...`
  );
  sh(venvPython, ['-m', 'pip', 'install', '--quiet', target, 'docstring_parser>=0.16']);

  console.log('Running API reference generator...');
  const json = shCapture(venvPython, [join(ROOT, 'scripts', 'docgen.py')]);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, json);
  const parsed = JSON.parse(json);
  console.log(`Wrote ${OUT_PATH} (sdk_version=${parsed.sdk_version})`);
}

main();
