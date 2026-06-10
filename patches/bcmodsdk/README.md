# bcmodsdk patches

Put `.patch` files here. They are applied in alphabetical order to a **copy**
of the submodule source (`.built-sdk/`) — the submodule at
`vendor/bondage-club-mod-sdk/` is never touched.

## How it works

```
vendor/bondage-club-mod-sdk/src/   ← pristine submodule (never modified)
               │
               │  scripts/sync-sdk.mjs copies to ↓
               │
.built-sdk/                        ← copy + patches applied
               │
               │  vite aliases import 'bondage-club-mod-sdk' to ↓
               │
final bundle                       ← patched SDK is what ships
```

## Creating a patch — step by step

### 1. Make sure the submodule is clean

```sh
cd vendor/bondage-club-mod-sdk
git status
```

If there are leftover changes from previous experiments, reset them:

```sh
git checkout -- .
```

### 2. Make your changes

Edit any file under `vendor/bondage-club-mod-sdk/src/`. For example:

```
vendor/bondage-club-mod-sdk/src/sdkApi.ts  ← add new API methods
vendor/bondage-club-mod-sdk/src/index.ts   ← change init behaviour
```

### 3. Generate the patch

From the submodule directory, capture **unstaged** changes:

```sh
cd vendor/bondage-club-mod-sdk
git diff > ../../patches/bcmodsdk/00-description.patch
```

Or capture **staged** changes (if you prefer to review with `git add -p` first):

```sh
git add src/...
git diff --staged > ../../patches/bcmodsdk/00-description.patch
```

> **Tip:** use a descriptive name — `00-expose-patch-function.patch` is much
> clearer than `00-fix.patch` six months later.

### 4. Review the patch

Open the `.patch` file and check that it only contains what you intended:

```sh
cat ../../patches/bcmodsdk/00-description.patch
```

### 5. Reset the submodule

Return the submodule to pristine state so only the `.patch` file carries your
changes:

```sh
git checkout -- .
```

### 6. Verify it applies

Run the sync script to confirm the patch applies cleanly against the current
submodule source:

```sh
cd ../..
npm run sync-sdk
```

You should see:

```
→ Cleaning .built-sdk/
→ Copying vendor/bondage-club-mod-sdk/src → .built-sdk/
✔ Copy done
✔ Applied: patches/bcmodsdk/00-description.patch

bcmodsdk sync: copy + 1 patch(es) applied, 0 failed
```

### 7. Test the build

```sh
npm run build
```

## Updating an existing patch

If you need to change a patch you already created:

```sh
# 1. Apply current patches to the submodule
cd vendor/bondage-club-mod-sdk
git apply ../../patches/bcmodsdk/00-description.patch

# 2. Make your additional changes to the source files
# ...

# 3. Generate a new patch from all your changes
git diff > ../../patches/bcmodsdk/00-description.patch

# 4. Reset and verify
git checkout -- .
cd ../..
npm run sync-sdk
```

## Updating the submodule (upstream)

When the upstream SDK is updated, patches may need rebasing:

```sh
cd vendor/bondage-club-mod-sdk
git pull origin main          # or the tracked branch
cd ../..
npm run sync-sdk              # may fail if patches no longer apply cleanly
```

If a patch fails to apply:

1. Open the failed `.patch` file — `patch` will tell you which hunk(s) failed.
2. Manually re-create the patch against the updated submodule source (follow the
   "Creating a patch" steps again).
3. Run `npm run sync-sdk` again.

## Naming convention

Use a two-digit numeric prefix so patches apply in a predictable order:

```
00-expose-mod-registry.patch
01-add-custom-logger.patch
02-fix-hook-priority.patch
```

Lower numbers apply first. If one patch depends on another, give the dependency
the lower number.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `patch: **** malformed patch` | The `.patch` file has encoding issues or was edited by hand | Re-generate from the submodule |
| `patch: **** hunk failed` | The submodule source has changed since the patch was made | Follow "Updating an existing patch" above |
| `npm run sync-sdk` shows no patches | `patches/bcmodsdk/` is empty or only has non-`.patch` files | Check file extensions |
| `.built-sdk/` missing after clone | New checkout — `sync-sdk` hasn't run yet | Run `npm run dev` or `npm run sync-sdk` |