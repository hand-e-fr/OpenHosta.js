export interface OpenHostaErrorOptions {
  cause?: unknown;
}

export class OhError extends Error {
  cause?: unknown;

  constructor(message: string, options?: OpenHostaErrorOptions) {
    super(message);
    if (options && "cause" in options) {
      this.cause = options.cause;
    }
    this.name = new.target.name;
  }
}

export class RequestError extends OhError {}

export class RateLimitError extends RequestError {}

export class ApiKeyError extends RequestError {}

export class FrameError extends OhError {}

export type OpenHostaError = OhError | RequestError | RateLimitError | ApiKeyError | FrameError;
