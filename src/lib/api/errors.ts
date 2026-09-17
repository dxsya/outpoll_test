export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function parseRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const date = Date.parse(value);
  if (Number.isNaN(date)) {
    return null;
  }

  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export async function fetchJson(input: RequestInfo | URL, init: RequestInit): Promise<unknown> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new ApiError(
      `Public API request failed with status ${response.status}`,
      response.status,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  return response.json();
}

export function parseFiniteNumber(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Invalid numeric field: ${fieldName}`);
  }

  return numberValue;
}

export function parseTimestampSeconds(value: unknown, fieldName: string): number {
  const timestamp = parseFiniteNumber(value, fieldName);
  if (timestamp <= 0) {
    throw new Error(`Invalid timestamp field: ${fieldName}`);
  }

  return timestamp;
}
