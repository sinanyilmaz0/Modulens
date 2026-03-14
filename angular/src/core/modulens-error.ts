/**
 * Structured error for Modulens with user-facing message and error code.
 * Used for controlled error handling; process exit decisions stay in CLI layer.
 */
export class ModulensError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ModulensError";
    Object.setPrototypeOf(this, ModulensError.prototype);
  }
}
