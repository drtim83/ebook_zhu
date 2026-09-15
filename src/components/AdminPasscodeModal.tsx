"use client";

import { useState } from "react";
import { verifyAdminPasscode } from "@/lib/auth";

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function AdminPasscodeModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Admin Verification",
  description = "Please enter the admin passcode to manage the public cloud library.",
}: AdminPasscodeModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (verifyAdminPasscode(passcode)) {
      setError(false);
      setPasscode("");
      onSuccess();
      onClose();
    } else {
      setError(true);
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError(false);
            }}
            placeholder="Enter passcode…"
            className={`rounded-lg border px-3 py-2 text-sm outline-hidden dark:bg-neutral-800 ${
              error
                ? "border-red-500 bg-red-500/10 focus:border-red-500"
                : "border-black/15 focus:border-black dark:border-white/20 dark:focus:border-white"
            }`}
          />

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Incorrect passcode. Please try again.
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Unlock &amp; Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
