import { API_URL } from '../data/constants';

interface PingResponse {
  status: string;
  timestamp: string;
  message: string;
}

class PingService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isActive = false;
  private pingInterval = 30000; // 30 seconds default
  private retryCount = 0;
  private maxRetries = 3;

  /**
   * Start the ping service to keep MSW service worker alive
   * @param intervalMs - Interval between pings in milliseconds (default: 30000)
   */
  start(intervalMs: number = 30000): void {
    if (this.isActive) {
      console.warn('PingService is already active');
      return;
    }

    this.pingInterval = intervalMs;
    this.isActive = true;
    this.retryCount = 0;

    console.log(`Starting MSW ping service with ${intervalMs}ms interval`);

    // Send initial ping immediately
    this.sendPing();

    // Set up periodic ping
    this.intervalId = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  /**
   * Stop the ping service
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log('Stopping MSW ping service');

    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Send a single ping request
   */
  private async sendPing(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Prevent caching to ensure fresh requests
        cache: 'no-cache',
      });

      if (response.ok) {
        const data: PingResponse = await response.json();
        console.log('MSW Ping successful:', data.timestamp);
        this.retryCount = 0; // Reset retry count on success
      } else {
        console.warn('MSW Ping failed with status:', response.status);
        this.handlePingFailure();
      }
    } catch (error) {
      console.error('MSW Ping error:', error);
      this.handlePingFailure();
    }
  }

  /**
   * Handle ping failures with exponential backoff
   */
  private handlePingFailure(): void {
    this.retryCount++;

    if (this.retryCount <= this.maxRetries) {
      const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
      console.log(
        `Retrying ping in ${backoffDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`,
      );

      setTimeout(() => {
        if (this.isActive) {
          this.sendPing();
        }
      }, backoffDelay);
    } else {
      console.error('MSW Ping failed after maximum retries, stopping service');
      this.stop();
    }
  }

  /**
   * Check if the ping service is currently active
   */
  get isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Get current ping interval
   */
  get interval(): number {
    return this.pingInterval;
  }
}

// Export singleton instance
export const pingService = new PingService();

// Export the class for testing or custom instances
export { PingService };
