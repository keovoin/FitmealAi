# Deploying the FitMeal Admin to Vercel

This is a step-by-step guide for getting `admin-web/` live on Vercel. **You don't need to install anything locally.**

## Step 1 — Sign in to Vercel

1. Open https://vercel.com
2. Click "Sign Up" (or "Log In") and choose **Continue with GitHub**
3. Approve the GitHub permission prompt — make sure `keovoin/FitmealAi` is in the list of repositories Vercel can access. If you only granted access to specific repos earlier, you can fix that at https://github.com/settings/installations -> Vercel -> Configure -> add `FitmealAi`.

## Step 2 — Import the project

1. From the Vercel dashboard, click **Add New** -> **Project**
2. Find `keovoin/FitmealAi` in the list and click **Import**

## Step 3 — IMPORTANT: Set the Root Directory

This is the step where most people get stuck. The repo has TWO Node projects: a legacy Vite one at the root (`./`) and the real admin app at `admin-web/`. **You must point Vercel at `admin-web`.**

On the configure screen you will see this section:

> **Root Directory** `./` [Edit]

Click the **Edit** button next to `./`.

A modal opens showing your repo's folders. **Click `admin-web`** so it becomes the new root, then click **Continue**.

The Root Directory field should now read:

> **Root Directory** `admin-web`

If you don't click Edit and you leave `./` selected, Vercel will try to build the Vite project at the root and the build will fail. So this step matters.

## Step 4 — Framework Preset

Once you set the Root Directory to `admin-web`, Vercel will auto-detect **Next.js**. The Framework Preset dropdown should switch to "Next.js" automatically. If it doesn't, set it manually.

## Step 5 — Add environment variables

Open the **Environment Variables** section on the same page.

You **must** set this one to log in:

| Name | Value | Environment |
|---|---|---|
| `ADMIN_PASSWORD` | a password you choose, **at least 8 characters** | All |
| `ADMIN_SESSION_SECRET` | a random string, **at least 32 characters** (Required for Vercel) | All |

If `ADMIN_PASSWORD` is unset or shorter than 8 chars on a production deployment, the admin will refuse all login attempts. (In local dev it falls back to a development-only password and prints a warning.)

> **You can also add `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc. here later** — same place, no code changes needed.

## Step 6 — Click Deploy

Vercel will:

1. Run `npm install` inside `admin-web/`
2. Run `npm run build` inside `admin-web/`
3. Deploy the resulting `.next` output

This takes 60-90 seconds. When it's done, you'll see a URL like `https://fitmealai-keovoin.vercel.app`.

## Step 7 — Open the URL and log in

1. Click the deployment URL
2. You'll be redirected to `/login`
3. Enter the password you set in `ADMIN_PASSWORD`
4. You're in. Browse the dashboard, payments queue, users, subscriptions, settings.

## Troubleshooting

### "I don't see admin-web in the Root Directory picker"

This usually means Vercel still has stale info about your repo. Try:

1. In the Import flow, click **Add GitHub Account** -> **Configure** -> make sure `FitmealAi` is in the allowed list
2. Refresh the import page
3. If still missing, open https://github.com/keovoin/FitmealAi/tree/main/admin-web in a new tab to confirm the folder exists on `main`. If you can see it on GitHub, Vercel will eventually catch up.

### "Build failed with 'next: command not found'"

You forgot to set the Root Directory to `admin-web`. Vercel ran `npm install` at the repo root (which uses Vite) and there's no `next` binary. Fix:

1. Open your project in Vercel
2. Settings -> General -> Root Directory -> click Edit
3. Set it to `admin-web`, click Save
4. Deployments -> click the three-dot menu on the latest -> Redeploy

### "Build failed with TypeScript or ESLint errors"

Check the build logs in Vercel. The fix is in the code, push it to a branch, open a PR, and merge.

### "I see my project but it's running the React Vite app, not the admin"

Same as above: Root Directory is set to `./` instead of `admin-web`. Fix by changing it in Settings -> General.

### "The login page works but I can't log in"

Make sure you set `ADMIN_PASSWORD` (at least 8 characters) in Vercel env vars, and that the password you're typing matches it exactly. Also note env var changes only take effect on a **new** deployment - go to Deployments, click Redeploy after changing env vars.

If `ADMIN_PASSWORD` is missing or too short on a production deployment, the admin will reject ALL login attempts and log an error to the Vercel function logs. Check the deployment logs to confirm.

## After deployment

Every time we push code to `main`, Vercel auto-deploys. You don't need to do anything.

For AI meal generation, make sure these env vars are set:
1. Get an OpenAI API key
2. Add `OPENAI_API_KEY` to Vercel env vars
3. Push the code
4. Vercel deploys, the API endpoint goes live
