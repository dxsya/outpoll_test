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

export type RequestStats = {
  sent: number;
  failed: number;
};

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

const MAX_TRANSIENT_RETRIES = 2;

function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function waitForRetry(milliseconds: number, signal: AbortSignal | null | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    function onAbort(): void {
      clearTimeout(timeout);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchJson(
  input: RequestInfo | URL,
  init: RequestInit,
  stats?: RequestStats,
): Promise<unknown> {
  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
    if (stats) {
      stats.sent += 1;
    }
    let response: Response;
    try {
      response = await fetch(input, init);
    } catch (error) {
      if (stats) {
        stats.failed += 1;
      }
      throw error;
    }
    if (response.ok) {
      return response.json();
    }

    if (stats) {
      stats.failed += 1;
    }

    const retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"));
    if (!isTransientStatus(response.status) || attempt === MAX_TRANSIENT_RETRIES) {
      throw new ApiError(
        `Public API request failed with status ${response.status}`,
        response.status,
        retryAfterSeconds,
      );
    }

    const backoffMilliseconds = Math.min(10_000, 500 * 2 ** attempt);
    await waitForRetry(
      retryAfterSeconds === null ? backoffMilliseconds : Math.min(10_000, retryAfterSeconds * 1000),
      init.signal,
    );
  }

  throw new Error("Public API retry loop ended unexpectedly");
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
