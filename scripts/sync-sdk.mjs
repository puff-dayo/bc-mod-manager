#!/usr/bin/env node

import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SDK_SRC = join(root, 'vendor', 'bondage-club-mod-sdk', 'src');
const BUILT_SDK = join(root, '.built-sdk');
const PATCHES_DIR = join(root, 'patches', 'bcmodsdk');

function fail(msg) {
  console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
  process.exit(1);
}

function info(msg) {
  console.log(`\x1b[36m→\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function toPosixPath(filePath) {
  return filePath.split(sep).join('/');
}

function removePatchArtifacts(dir) {
  if (!existsSync(dir)) return;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      removePatchArtifacts(entryPath);
      continue;
    }

    if (entry.name.endsWith('.rej') || entry.name.endsWith('.orig')) {
      rmSync(entryPath, { force: true });
    }
  }
}

// --- guard: submodule source must exist ------------------------------------
if (!existsSync(SDK_SRC)) {
  fail(`SDK source not found at ${SDK_SRC}\n  Run: git submodule update --init`);
}

// --- 1. Clean and copy -----------------------------------------------------
info('Cleaning .built-sdk/');
rmSync(BUILT_SDK, { recursive: true, force: true });

info(`Copying vendor/bondage-club-mod-sdk/src → .built-sdk/`);
cpSync(SDK_SRC, BUILT_SDK, { recursive: true });
success('Copy done');

// --- 2. Apply patches ------------------------------------------------------
if (!existsSync(PATCHES_DIR)) {
  info('No patches directory — skipping patch step');
  process.exit(0);
}

const patchFiles = readdirSync(PATCHES_DIR)
  .filter(f => f.endsWith('.patch'))
  .sort();

if (patchFiles.length === 0) {
  info('No .patch files found — skipping patch step');
  process.exit(0);
}

let applied = 0;
let failed = 0;

for (const patchFile of patchFiles) {
  const patchPath = join(PATCHES_DIR, patchFile);
  const patchLabel = `patches/bcmodsdk/${patchFile}`;

  try {
    execFileSync('git', [
      'apply',
      '-p1',
      '--whitespace=nowarn',
      `--directory=${toPosixPath(relative(root, BUILT_SDK))}`,
      toPosixPath(relative(root, patchPath)),
    ], {
      cwd: root,
      stdio: 'pipe',
    });
    applied++;
    success(`Applied: ${patchLabel}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      fail('Git executable not found. Install Git and make sure it is available on PATH.');
    }

    failed++;
    console.error(`\x1b[31m✖ Failed: ${patchLabel}\x1b[0m`);
    const stdout = err.stdout?.toString() ?? '';
    const stderr = err.stderr?.toString() ?? '';
    // Print the rejected hunks if any
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
  }
}

// --- 3. Clean up reject files ----------------------------------------------
removePatchArtifacts(BUILT_SDK);

// --- Summary ----------------------------------------------------------------
console.log(`\nbcmodsdk sync: copy + ${applied} patch(es) applied, ${failed} failed`);
if (failed) process.exit(1);
