/**
 * Privacy-Safe Error Sanitization
 *
 * Enforces strict redaction of PII, secrets, auth tokens, database internals,
 * and user payloads before telemetry or logging.
 */

export interface SanitizedErrorInfo {
  name: string;
  message: string;
  errorCode?: string;
  statusCode?: number;
  stackFingerprint?: string;
}

const MAX_MESSAGE_LENGTH = 200;

// Regex patterns for redaction
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]+)?/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const SUPABASE_KEY_PATTERN =
  /(?:sbp_[a-zA-Z0-9_-]{10,}|sb_[a-zA-Z0-9_-]{10,}|anon[a-zA-Z0-9_-]{10,})/gi;
const DB_SECRET_PATTERN = /(?:db_secret|service_role|secret_key)[_a-zA-Z0-9-]*/gi;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BR_PHONE_PATTERN =
  /(?:\+55\s?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g;
const UUID_PATTERN =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
const SENSITIVE_PARAM_PATTERN =
  /([?&](?:token|auth|key|secret|password|pwd|email|phone|customer_id|apikey|access_token|refresh_token)=)[^&]+/gi;
const AUTH_HEADER_PATTERN = /(authorization|cookie|set-cookie):\s*[^\r\n]+/gi;

/**
 * Strips secrets, tokens, customer PII, and sensitive URL query params from strings.
 */
export function redactSensitiveData(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(AUTH_HEADER_PATTERN, "$1: [REDACTED_HEADER]")
    .replace(SENSITIVE_PARAM_PATTERN, "$1[REDACTED]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED_TOKEN]")
    .replace(JWT_PATTERN, "[REDACTED_JWT]")
    .replace(SUPABASE_KEY_PATTERN, "[REDACTED_KEY]")
    .replace(DB_SECRET_PATTERN, "[REDACTED_SECRET]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(BR_PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(UUID_PATTERN, "[REDACTED_ID]");
}

/**
 * Truncates string to a safe maximum length with ellipsis.
 */
export function truncateMessage(text: string, maxLength = MAX_MESSAGE_LENGTH): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Sanitizes any JavaScript or Supabase error safely, guaranteeing zero throws.
 */
export function sanitizeError(error: unknown): SanitizedErrorInfo {
  try {
    let rawName = "Error";
    let rawMessage = "Unexpected application error";
    let errorCode: string | undefined;
    let statusCode: number | undefined;
    let stackFingerprint: string | undefined;

    if (error && typeof error === "object") {
      const errObj = error as Record<string, any>;

      // Extract error name
      if (typeof errObj.name === "string" && errObj.name.trim()) {
        rawName = errObj.name.trim();
      }

      // Handle PostgREST / Supabase error objects
      if (errObj.code && typeof errObj.code === "string") {
        errorCode = errObj.code.trim();
      }
      if (typeof errObj.status === "number") {
        statusCode = errObj.status;
      } else if (typeof errObj.statusCode === "number") {
        statusCode = errObj.statusCode;
      }

      // Extract raw message
      if (typeof errObj.message === "string" && errObj.message.trim()) {
        rawMessage = errObj.message.trim();
      } else if (typeof errObj.error_description === "string") {
        rawMessage = errObj.error_description.trim();
      } else if (typeof errObj.msg === "string") {
        rawMessage = errObj.msg.trim();
      }

      // Limited stack fingerprint only in development or test
      const isDev =
        (typeof process !== "undefined" &&
          (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")) ||
        (typeof import.meta !== "undefined" && import.meta.env?.DEV);

      if (isDev && typeof errObj.stack === "string") {
        const firstTwoLines = errObj.stack.split("\n").slice(0, 2).join(" ");
        stackFingerprint = truncateMessage(redactSensitiveData(firstTwoLines), 150);
      }
    } else if (typeof error === "string" && error.trim()) {
      rawMessage = error.trim();
    }

    // Apply redactions and truncation
    const sanitizedName = truncateMessage(rawName, 50);
    const sanitizedMessage = truncateMessage(redactSensitiveData(rawMessage), MAX_MESSAGE_LENGTH);

    return {
      name: sanitizedName || "Error",
      message: sanitizedMessage || "Unexpected application error",
      errorCode,
      statusCode,
      stackFingerprint,
    };
  } catch {
    // Fail-safe fallback — never throw while reporting errors
    return {
      name: "Error",
      message: "Unexpected application error",
    };
  }
}
