# Launch TRAX on GitHub Pages

The app files are already on the **`gh-pages`** branch. You only need to turn Pages on once.

## Step 1 — Open Pages settings

**https://github.com/simonlatham155-tech/trax/settings/pages**

## Step 2 — Configure

Under **Build and deployment**:

| Setting | Value |
|---------|--------|
| **Source** | Deploy from a branch |
| **Branch** | `gh-pages` |
| **Folder** | `/ (root)` |

Click **Save**.

## Step 3 — Wait 1–3 minutes

GitHub will show a green banner with your site URL when ready.

## Step 4 — Open the app

**https://simonlatham155-tech.github.io/trax/**

Use **Chrome** or **Edge** for best audio support.

---

## Still 404?

1. Confirm **Settings → Pages** shows: *“Your site is live at …”*
2. Hard refresh: `Cmd + Shift + R`
3. Check the `gh-pages` branch exists: https://github.com/simonlatham155-tech/trax/tree/gh-pages  
   It should contain `index.html`, `assets/`, and `worklets/` only.

## Updates

Every push to `main` auto-rebuilds and updates `gh-pages` via GitHub Actions.
