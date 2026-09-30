/**
 * FlowForge Rate Limiter
 * Implements sliding-window log rate limiting with burst and per-minute thresholds.
 */

export interface RateLimitStatus {
  allowed: boolean;
  currentCount: number;
  maxPerMinute: number;
  remaining: number;
  resetInSeconds: number;
  reason?: string;
}

export class WorkflowRateLimiter {
  // Map of workflowId -> timestamps of recent executions (epoch ms)
  private executionWindows: Map<string, number[]> = new Map();
  // Map of workflowId -> burst count tracking within 5-second windows
  private burstWindows: Map<string, number[]> = new Map();

  /**
   * Check and consume rate limit slot for a workflow
   */
  public checkLimit(
    workflowId: string,
    maxPerMinute: number = 60,
    burstLimit: number = 10
  ): RateLimitStatus {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const fiveSecondsAgo = now - 5 * 1000;

    // Clean up older timestamps for this workflow
    const timestamps = (this.executionWindows.get(workflowId) || []).filter(t => t > oneMinuteAgo);
    const burstTimestamps = (this.burstWindows.get(workflowId) || []).filter(t => t > fiveSecondsAgo);

    // 1. Check Burst Limit (ex: no more than burstLimit requests within 5 seconds)
    if (burstTimestamps.length >= burstLimit) {
      const oldestBurst = burstTimestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldestBurst + 5000 - now) / 1000));
      return {
        allowed: false,
        currentCount: timestamps.length,
        maxPerMinute,
        remaining: 0,
        resetInSeconds,
        reason: `Burst rate limit exceeded (${burstLimit} requests within 5s window). Cooldown: ${resetInSeconds}s.`
      };
    }

    // 2. Check 1-minute window
    if (timestamps.length >= maxPerMinute) {
      const oldest = timestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldest + 60000 - now) / 1000));
      return {
        allowed: false,
        currentCount: timestamps.length,
        maxPerMinute,
        remaining: 0,
        resetInSeconds,
        reason: `Workflow rate limit exceeded (${maxPerMinute} executions/min). Resets in ${resetInSeconds}s.`
      };
    }

    // Record this execution
    timestamps.push(now);
    burstTimestamps.push(now);
    this.executionWindows.set(workflowId, timestamps);
    this.burstWindows.set(workflowId, burstTimestamps);

    const remaining = Math.max(0, maxPerMinute - timestamps.length);
    const resetInSeconds = timestamps.length > 0 
      ? Math.max(1, Math.ceil((timestamps[0] + 60000 - now) / 1000))
      : 60;

    return {
      allowed: true,
      currentCount: timestamps.length,
      maxPerMinute,
      remaining,
      resetInSeconds
    };
  }

  /**
   * Reset rate limit state for a workflow
   */
  public reset(workflowId: string): void {
    this.executionWindows.delete(workflowId);
    this.burstWindows.delete(workflowId);
  }

  /**
   * Reset all rate limit states
   */
  public resetAll(): void {
    this.executionWindows.clear();
    this.burstWindows.clear();
  }
}

export const globalRateLimiter = new WorkflowRateLimiter();
