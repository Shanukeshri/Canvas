export type TabSyncMessage =
  | { type: 'TIMER_STATE_SYNC'; payload: any; userId?: string }
  | { type: 'TIMER_RESET'; payload: { newDurationMinutes?: number }; userId?: string }
  | { type: 'TAB_ACTIVE_PING'; tabId: string; userId?: string }
  | { type: 'THEME_CHANGED'; themeId: string; userId?: string };

class ZenBroadcastChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: TabSyncMessage) => void> = new Set();
  public tabId: string = Math.random().toString(36).substring(2, 9);

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('zen_tabs_sync');
      this.channel.onmessage = (event) => {
        const msg = event.data as TabSyncMessage;
        this.listeners.forEach((listener) => listener(msg));
      };
    }
  }

  public publish(msg: TabSyncMessage) {
    if (this.channel) {
      this.channel.postMessage(msg);
    }
  }

  public subscribe(listener: (msg: TabSyncMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const tabSync = new ZenBroadcastChannel();
