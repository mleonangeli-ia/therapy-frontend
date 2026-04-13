export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  patientId: string;
  fullName: string;
  email: string;
  consentRequired: boolean;
}

export interface Patient {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  countryCode: string;
  timezone: string;
  language: string;
  consentSignedAt?: string;
  createdAt: string;
}

export interface PackType {
  id: string;
  name: string;
  sessionCount: number;
  priceAmount: number;
  priceCurrency: string;
  validityDays: number;
  description: string;
}

export interface Pack {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "COMPLETED" | "EXPIRED" | "REFUNDED" | "CANCELLED";
  sessionsUsed: number;
  sessionsTotal: number;
  sessionsRemaining: number;
  purchasedAt?: string;
  activatedAt?: string;
  expiresAt?: string;
  packType: PackType;
}

export interface Session {
  id: string;
  sessionNumber: number;
  title?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  modality: "TEXT" | "AUDIO" | "MIXED";
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  moodStart?: number;
  moodEnd?: number;
  crisisFlag: boolean;
  messages?: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  role: "PATIENT" | "ASSISTANT";
  contentType: "TEXT" | "AUDIO_TRANSCRIPT" | "AUDIO_RESPONSE";
  contentText?: string;
  audioUrl?: string;
  sequenceNumber: number;
  createdAt: string;
}

export interface SessionReport {
  id: string;
  sessionId: string;
  sessionNumber: number;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  generatedAt?: string;
  downloadCount: number;
  errorMessage?: string;
}
