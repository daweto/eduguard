# 📦 Version Management Strategy

This document explains how we manage Node.js and pnpm versions across local development, CI/CD, and all workspaces in the monorepo.

## 🎯 Single Source of Truth

### Node.js Version

**File:** `.nvmrc` (root)

```
v20.18.0
```

**Used by:**

- ✅ Local development (via `nvm use` or auto-switching)
- ✅ GitHub Actions (via `node-version-file: '.nvmrc'`)
- ✅ All apps and packages in the monorepo

**Also declared in:** `package.json` → `engines.node`

### pnpm Version

**File:** `package.json` (root)

```json
{
  "packageManager": "pnpm@8.15.6",
  "engines": {
    "pnpm": "8.15.6"
  }
}
```

**Used by:**

- ✅ Corepack (automatically enforces this version)
- ✅ GitHub Actions (via `pnpm/action-setup@v4` reading `packageManager`)
- ✅ All apps and packages in the monorepo

## 🚀 How It Works

### Local Development

#### 1. Node.js (via nvm)

**Install nvm if you haven't:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Using nvm:**

```bash
# Manual switch (when entering project directory)
nvm use

# Or install auto-nvm for automatic switching
# Add to ~/.zshrc or ~/.bashrc:
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc && -r .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chdir load-nvmrc
load-nvmrc
```

**Verify:**

```bash
node --version
# Should output: v20.18.0
```

#### 2. pnpm (via Corepack - Built into Node.js 16.9+)

**Enable Corepack (one-time):**

```bash
corepack enable
```

**That's it!** Corepack reads `packageManager` from `package.json` and automatically:

- Downloads pnpm@8.15.6 if not installed
- Uses pnpm@8.15.6 for all commands
- Prevents using wrong versions

**Verify:**

```bash
pnpm --version
# Should output: 8.15.6
```

**Manual installation (alternative if not using Corepack):**

```bash
npm install -g pnpm@8.15.6
```

### GitHub Actions

Both versions are **automatically enforced** in CI:

```yaml
# Node.js - reads from .nvmrc
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: ".nvmrc"

# pnpm - reads from package.json's "packageManager" field
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  # No version specified = reads from packageManager field
```

**No hardcoded versions in workflows!** ✅

## 📁 Workspace Structure

All apps and packages inherit from the root:

```
skyward-hackathon/               (ROOT)
├── .nvmrc                       → v20.18.0
├── package.json                 → pnpm@8.15.6
│
├── apps/
│   ├── api-v2/                  (inherits versions)
│   ├── webhook-proxy/           (inherits versions)
│   ├── teacher-client/          (inherits versions)
│   └── ai-agents/               (inherits versions)
│
└── packages/
    ├── config-eslint/           (inherits versions)
    └── config-typescript/       (inherits versions)
```

**No need for per-app `.nvmrc` or `packageManager` fields!**

## 🔄 Updating Versions

### To Update Node.js

1. **Update `.nvmrc`:**

   ```bash
   echo "v20.21.0" > .nvmrc
   ```

2. **Update `package.json`:**

   ```json
   "engines": {
     "node": ">=20.21.0",
     "pnpm": "8.15.6"
   }
   ```

3. **Locally:**

   ```bash
   nvm install 20.21.0
   nvm use
   ```

4. **Commit and push** - GitHub Actions will automatically use new version

### To Update pnpm

1. **Update `package.json`:**

   ```json
   {
     "packageManager": "pnpm@9.0.0",
     "engines": {
       "node": ">=20.18.0",
       "pnpm": "9.0.0"
     }
   }
   ```

2. **Locally (if using Corepack):**

   ```bash
   # Corepack will automatically download new version
   pnpm --version
   # Should output: 9.0.0
   ```

3. **Or manually:**

   ```bash
   npm install -g pnpm@9.0.0
   ```

4. **Update lockfile:**

   ```bash
   pnpm install
   ```

5. **Commit and push** - GitHub Actions will automatically use new version

## ✅ Verification

### Check Your Setup

Run this to verify everything is correct:

```bash
# Check Node version
node --version
# Expected: v20.18.0

# Check pnpm version
pnpm --version
# Expected: 8.15.6

# Check if versions match package.json
cat package.json | grep -A 3 '"engines"'
cat package.json | grep 'packageManager'

# Check .nvmrc
cat .nvmrc
```

### Verify in CI

When GitHub Actions runs, check the logs:

```
✓ Setup Node.js
  Using Node.js version: 20.18.0 (from .nvmrc)

✓ Setup pnpm
  Using pnpm version: 8.15.6 (from package.json)
```

## 🎯 Best Practices

### ✅ DO:

- Keep versions in sync between `.nvmrc`, `package.json`, and `engines`
- Use Corepack for automatic pnpm version management
- Update versions via root `package.json` only
- Test locally before committing version updates

### ❌ DON'T:

- Hardcode versions in GitHub Actions workflows
- Add per-app `.nvmrc` or `packageManager` fields (use root)
- Forget to update `engines` when changing versions
- Skip testing after version updates

## 📚 References

- **Corepack:** https://nodejs.org/api/corepack.html
- **packageManager field:** https://nodejs.org/api/packages.html#packagemanager
- **nvm:** https://github.com/nvm-sh/nvm
- **pnpm:** https://pnpm.io/installation

## 🆘 Troubleshooting

### "pnpm: command not found"

**Solution 1 - Enable Corepack:**

```bash
corepack enable
```

**Solution 2 - Install manually:**

```bash
npm install -g pnpm@8.15.6
```

### "Wrong pnpm version"

**If using Corepack:**

```bash
corepack enable
corepack prepare pnpm@8.15.6 --activate
```

**If using global install:**

```bash
npm install -g pnpm@8.15.6
```

### "Wrong Node version"

```bash
nvm install 20.18.0
nvm use
```

### GitHub Actions using wrong version

- Check that `.nvmrc` exists and is committed
- Check that `package.json` has `packageManager` field
- Check workflow files don't hardcode versions
- Re-run the workflow

---

**Last Updated:** 2025-10-26  
**Current Versions:**

- Node.js: `v20.18.0`
- pnpm: `8.15.6`
