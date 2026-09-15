const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "";

/** Check if an admin passcode is configured. */
export function isAdminPasscodeRequired(): boolean {
  return Boolean(ADMIN_PASSCODE && ADMIN_PASSCODE.trim().length > 0);
}

/** Check if the current browser session has already unlocked admin access. */
export function isUserAdmin(): boolean {
  if (!isAdminPasscodeRequired()) return true;
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ebook_admin_unlocked") === "true";
}

/** Verify entered passcode and save unlock status if correct. */
export function verifyAdminPasscode(input: string): boolean {
  if (!isAdminPasscodeRequired()) return true;
  const valid = input.trim() === ADMIN_PASSCODE.trim();
  if (valid && typeof window !== "undefined") {
    localStorage.setItem("ebook_admin_unlocked", "true");
  }
  return valid;
}

/** Lock admin mode. */
export function lockAdmin(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ebook_admin_unlocked");
  }
}
