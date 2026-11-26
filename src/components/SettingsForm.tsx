"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/settings";
import {
  ADMIN_EMAIL,
  isAuthorizedAdmin,
  isSignedInAdminUnverified,
  isUserAdmin,
  lockAdmin,
  refreshAdminVerification,
  sendAdminVerificationEmail,
  signInAdmin,
  subscribeToAuth,
} from "@/lib/auth";

export default function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSettings(getSettings());
      setIsAdmin(isUserAdmin());
      setLoaded(true);
    });
    const unsubscribe = subscribeToAuth((fbUser) => {
      setIsAdmin(isAuthorizedAdmin(fbUser));
      setNeedsVerification(isSignedInAdminUnverified(fbUser));
      setSignedInEmail(fbUser?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
  }

  if (!loaded) {
    return <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center px-4 py-8 text-sm text-neutral-500">Loading…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Library
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-500">
          Choose what powers OCR and translation. Everything here is stored only in this browser.
        </p>
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">OCR engine</h2>
        <p className="text-xs text-neutral-500">Extracts text from your scanned pages.</p>
        <div className="mt-1 flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="ocrEngine"
              checked={settings.ocrEngine === "tesseract"}
              onChange={() => update("ocrEngine", "tesseract")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Tesseract.js</span> — free, runs locally in your browser, no API key.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="ocrEngine"
              checked={settings.ocrEngine === "gemini"}
              onChange={() => update("ocrEngine", "gemini")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Gemini</span> — usually more accurate on messy scans/handwriting, needs an API key below.
            </span>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">Translation engine</h2>
        <p className="text-xs text-neutral-500">Translates recognized page text.</p>
        <div className="mt-1 flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="translationEngine"
              checked={settings.translationEngine === "libretranslate"}
              onChange={() => update("translationEngine", "libretranslate")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">LibreTranslate</span> — self-hosted, free. Needs a server running (see README).
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="translationEngine"
              checked={settings.translationEngine === "gemini"}
              onChange={() => update("translationEngine", "gemini")}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Gemini</span> — usually higher quality, especially on messy OCR text.
            </span>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">Gemini API key</h2>
        <p className="text-xs text-neutral-500">
          Only needed if you selected Gemini above. Get a key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google AI Studio
          </a>
          . Stored only in this browser (localStorage) and sent directly to Google&apos;s API — never to a server of
          ours.
        </p>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={settings.geminiApiKey}
            onChange={(e) => update("geminiApiKey", e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
            className="flex-1 rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="rounded border border-black/15 px-3 text-sm dark:border-white/20"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">Model</label>
          <input
            value={settings.geminiModel}
            onChange={(e) => update("geminiModel", e.target.value)}
            placeholder="gemini-3.6-flash"
            className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <p className="text-xs text-neutral-400">
            Google occasionally retires model names. If you get a &quot;model not found&quot;
            error, try <code className="rounded bg-black/10 px-1 dark:bg-white/10">gemini-flash-latest</code> or{" "}
            <code className="rounded bg-black/10 px-1 dark:bg-white/10">gemini-pro-latest</code> — those aliases
            always point at Google&apos;s current model.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">☁️ Firebase Cloud &amp; Netlify</h2>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Connected
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          Powers the public digital library and CDN storage. Readers can read freely with zero login.
        </p>
        <div className="flex flex-col gap-2 rounded-lg bg-black/[0.02] p-3 text-xs dark:bg-white/[0.03]">
          <div className="flex justify-between">
            <span className="text-neutral-500">Cloud Provider:</span>
            <span className="font-mono font-medium">Google Firebase (Firestore)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Firebase Project:</span>
            <span className="font-mono font-medium">ebookzhu</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Asset Storage:</span>
            <span className="font-mono font-medium">Public CDN (/books)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Auth Domain:</span>
            <span className="font-mono font-medium">ebookzhu.firebaseapp.com</span>
          </div>
        </div>

        {/* Firebase Admin Auth Status */}
        <div className="mt-1 flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Admin Authorization</span>
              {isAdmin ? (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  🔓 Verified Admin
                </span>
              ) : needsVerification ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ✉️ Verification Required
                </span>
              ) : (
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  🔒 Reader Mode
                </span>
              )}
            </div>
            {(isAdmin || needsVerification) && (
              <button
                type="button"
                onClick={async () => {
                  await lockAdmin();
                  setIsAdmin(false);
                  setNeedsVerification(false);
                  setSignedInEmail(null);
                  setAdminError(null);
                  setVerificationSent(false);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Sign out
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {isAdmin
              ? `Signed in as ${signedInEmail || ADMIN_EMAIL}. You can publish and delete cloud books; readers view with zero login.`
              : needsVerification
              ? `Signed in as ${signedInEmail || ADMIN_EMAIL}, but email verification is required before Firestore & Storage write rules allow edits.`
              : `Sign in with your Firebase admin account (${ADMIN_EMAIL}) to publish or delete books. Readers browse with zero login.`}
          </p>

          {needsVerification && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={adminLoading}
                onClick={async () => {
                  setAdminError(null);
                  setAdminLoading(true);
                  try {
                    await sendAdminVerificationEmail();
                    setVerificationSent(true);
                  } catch (err) {
                    setAdminError(err instanceof Error ? err.message : "Failed to send verification email.");
                  } finally {
                    setAdminLoading(false);
                  }
                }}
                className="rounded border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                Send verification email
              </button>
              <button
                type="button"
                disabled={adminLoading}
                onClick={async () => {
                  setAdminError(null);
                  setAdminLoading(true);
                  try {
                    const verified = await refreshAdminVerification();
                    setIsAdmin(verified);
                    setNeedsVerification(!verified);
                    if (!verified) {
                      setAdminError("Email is not verified yet. Open the verification link in your inbox, then check again.");
                    }
                  } catch (err) {
                    setAdminError(err instanceof Error ? err.message : "Verification check failed.");
                  } finally {
                    setAdminLoading(false);
                  }
                }}
                className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {adminLoading ? "Checking…" : "I've verified — check again"}
              </button>
              {verificationSent && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Verification email sent.
                </span>
              )}
            </div>
          )}

          {!isAdmin && !needsVerification && (
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setAdminError(null);
                }}
                placeholder="Admin email…"
                autoComplete="email"
                className="flex-1 rounded border border-black/15 bg-transparent px-3 py-1.5 text-xs dark:border-white/20"
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError(null);
                }}
                placeholder="Password…"
                autoComplete="current-password"
                className="flex-1 rounded border border-black/15 bg-transparent px-3 py-1.5 text-xs dark:border-white/20"
              />
              <button
                type="button"
                disabled={adminLoading || !adminEmail.trim() || !adminPassword}
                onClick={async () => {
                  setAdminError(null);
                  setVerificationSent(false);
                  setAdminLoading(true);
                  try {
                    const result = await signInAdmin(adminEmail, adminPassword);
                    setIsAdmin(result.isAdmin);
                    setNeedsVerification(result.needsVerification);
                    setSignedInEmail(result.user.email ?? null);
                    if (result.isAdmin) {
                      setAdminPassword("");
                    }
                  } catch (err) {
                    setAdminError(err instanceof Error ? err.message : "Invalid admin credentials.");
                  } finally {
                    setAdminLoading(false);
                  }
                }}
                className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {adminLoading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          )}
          {adminError && (
            <p className="text-[11px] text-red-500">{adminError}</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-medium">Google Drive API key</h2>
        <p className="text-xs text-neutral-500">
          Needed to import images from shared Google Drive folders. Get a key from the{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google Cloud Console
          </a>{" "}
          (enable the Drive API first). Stored only in this browser.
        </p>
        <input
          type="password"
          value={settings.googleDriveApiKey}
          onChange={(e) => update("googleDriveApiKey", e.target.value)}
          placeholder="AIza…"
          autoComplete="off"
          className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Save settings
        </button>
        {saved && <span className="text-sm text-neutral-500">Saved.</span>}
      </div>
    </div>
  );
}
