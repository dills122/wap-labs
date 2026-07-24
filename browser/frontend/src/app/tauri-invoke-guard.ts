import type { TauriInvoke } from '../../../contracts/generated/tauri-host-client';

/**
 * Wraps a `TauriInvoke` implementation with a minimal runtime guard at the
 * IPC trust boundary.
 *
 * `browser/contracts/generated/tauri-host-client.ts` is generated (see
 * AGENTS.md) and every one of its ~30 wrapper methods trusts
 * `invokeFn<T>(...)` responses at compile time only -- there is no runtime
 * shape check before the value is cast to `T` and, for
 * `EngineRuntimeSnapshot`/`EngineFrame` results, fed into the deep-equality
 * comparators in navigation-state.ts (`engineSnapshotsEqual`,
 * `shouldRenderTimerSnapshot`, ...).
 *
 * Full structural validation of every response shape would require either
 * hand-editing the generated file (not allowed) or duplicating the
 * generated contract in a schema-validation library, which is a much
 * larger integration than this trust boundary warrants right now. This
 * guard instead closes the narrowest, highest-value gap: none of
 * `TauriHostClient`'s methods are typed to resolve with `null`/`undefined`,
 * so a host response that comes back empty (e.g. IPC deserialization
 * failure) is treated as a hard error here instead of silently flowing
 * into snapshot comparisons as if it were valid data.
 */
export const createGuardedTauriInvoke =
  (invokeFn: TauriInvoke): TauriInvoke =>
  async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
    const result = await invokeFn<T>(command, args);
    if (result === null || result === undefined) {
      throw new Error(`Host command "${command}" returned no data.`);
    }
    return result;
  };
