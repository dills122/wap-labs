import type { ScriptTimerRequestSnapshot } from '../../../contracts/engine';
import { WAVES_CONFIG } from './waves-config';

interface ScriptTimerEntry {
  id: string;
  token?: string;
  dueMs: number;
  order: number;
}

export interface ScriptTimerExpired {
  id: string;
  token?: string;
  dueMs: number;
}

export interface ScriptTimerApplyResult {
  scheduled: Array<{ id: string; token?: string; delayMs: number; dueMs: number }>;
  cancelled: string[];
}

export class ScriptTimerRegistry {
  private nowMs = 0;
  private sequence = 0;
  private readonly tokenIndex = new Map<string, string>();
  private readonly entries = new Map<string, ScriptTimerEntry>();

  reset(): void {
    this.nowMs = 0;
    this.sequence = 0;
    this.tokenIndex.clear();
    this.entries.clear();
  }

  hasActiveTimers(): boolean {
    return this.entries.size > 0;
  }

  currentTimeMs(): number {
    return this.nowMs;
  }

  applyRequests(requests: ScriptTimerRequestSnapshot[]): ScriptTimerApplyResult {
    const scheduled: Array<{ id: string; token?: string; delayMs: number; dueMs: number }> = [];
    const cancelled: string[] = [];

    for (const request of requests) {
      if (request.type === 'cancel') {
        const id = this.tokenIndex.get(request.token);
        if (id) {
          this.entries.delete(id);
          this.tokenIndex.delete(request.token);
        }
        cancelled.push(request.token);
        continue;
      }

      const delayMs = Math.max(0, request.delayMs);
      const dueMs = this.nowMs + delayMs;
      if (request.token) {
        const existingId = this.tokenIndex.get(request.token);
        if (existingId) {
          this.entries.delete(existingId);
        }
      }

      const id = request.token
        ? `token:${request.token}`
        : `anon:${this.sequence
            .toString()
            .padStart(WAVES_CONFIG.scriptTimerAnonymousIdPadLength, '0')}`;
      const entry: ScriptTimerEntry = {
        id,
        token: request.token,
        dueMs,
        order: this.sequence++
      };
      this.entries.set(id, entry);
      if (request.token) {
        this.tokenIndex.set(request.token, id);
      }
      scheduled.push({ id, token: request.token, delayMs, dueMs });
    }

    return { scheduled, cancelled };
  }

  advance(deltaMs: number): ScriptTimerExpired[] {
    this.nowMs += Math.max(0, deltaMs);
    const due = [...this.entries.values()]
      .filter((entry) => entry.dueMs <= this.nowMs)
      .sort((a, b) => (a.dueMs === b.dueMs ? a.order - b.order : a.dueMs - b.dueMs));

    for (const entry of due) {
      this.entries.delete(entry.id);
      if (entry.token) {
        this.tokenIndex.delete(entry.token);
      }
    }

    return due.map((entry) => ({ id: entry.id, token: entry.token, dueMs: entry.dueMs }));
  }
}
