"use client";

import { useState } from "react";
import {
  ADMIN_EMAIL,
  refreshAdminVerification,
  sendAdminVerificationEmail,
  signInAdmin,
} from "@/lib/auth";

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

function getAuthErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code?: unknown }).code);
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "Invalid email or password.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many sign-in attempts. Please wait a moment and try again.";
    }
  }
  return err instanceof Error ? err.message : "Unable to sign in.";
}

export default function AdminPasscodeModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Admin Sign-In",
  description = "Sign in with your authorized Firebase admin account to manage the public cloud library.",
}: AdminPasscodeModalProps) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerificationSent(false);
    setLoading(true);
    try {
      const result = await signInAdmin(email, password);
      if (result.needsVerification) {
        setNeedsVerification(true);
        return;
      }
      setNeedsVerification(false);
      setPassword("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendVerification() {
    setError(null);
    setLoading(true);
    try {
      await sendAdminVerificationEmail();
      setVerificationSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckVerified() {
    setError(null);
    setLoading(true);
    try {
      const verified = await refreshAdminVerification();
      if (verified) {
        setNeedsVerification(false);
        setVerificationSent(false);
        setPassword("");
        onSuccess();
        onClose();
      } else {
        setError("Email is not verified yet. Open the link in your inbox, then try again.");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">🔒 {title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </p>

        {needsVerification ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              Your email must be verified before Firestore &amp; Storage security rules allow cloud writes.
            </div>
            {verificationSent && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Verification email sent. Check your inbox and click the link.
              </p>
            )}
            {error && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={loading}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                Send verification email
              </button>
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={loading}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {loading ? "Checking…" : "I've verified — check again"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Admin email…"
              autoComplete="email"
              required
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-hidden focus:border-black dark:border-white/20 dark:bg-neutral-800 dark:focus:border-white"
            />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Password…"
              autoComplete="current-password"
              required
              className={`rounded-lg border px-3 py-2 text-sm outline-hidden dark:bg-neutral-800 ${
                error
                  ? "border-red-500 bg-red-500/10 focus:border-red-500"
                  : "border-black/15 focus:border-black dark:border-white/20 dark:focus:border-white"
              }`}
            />

            {error && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {loading ? "Signing in…" : "Sign in & Proceed"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
