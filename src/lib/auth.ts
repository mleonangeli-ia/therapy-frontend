import { AuthResponse } from "@/types";

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem("access_token", auth.accessToken);
  localStorage.setItem("refresh_token", auth.refreshToken);
  localStorage.setItem("patient_id", auth.patientId);
  localStorage.setItem("patient_name", auth.fullName);
  localStorage.setItem("consent_required", String(auth.consentRequired));
  const expiry = getTokenExpiry(auth.accessToken);
  if (expiry) localStorage.setItem("token_expiry", String(expiry));
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("patient_id");
  localStorage.removeItem("patient_name");
  localStorage.removeItem("consent_required");
  localStorage.removeItem("token_expiry");
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return false;
  const expiry = localStorage.getItem("token_expiry");
  if (!expiry) return false;
  return Date.now() > parseInt(expiry);
}

export function getPatientId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("patient_id");
}

export function getPatientName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("patient_name");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export function isConsentRequired(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("consent_required") === "true";
}
