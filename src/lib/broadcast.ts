export type TabSyncMessage =
  | { type: 'TIMER_STATE_SYNC'; payload: any; userId?: string }
  | { type: 'TIMER_RESET'; payload: { newDurationMinutes?: number }; userId?: string }
  | { type: 'TAB_ACTIVE_PING'; tabId: string; userId?: string }
  | { type: 'THEME_CHANGED'; themeId: string; userId?: string }
  | { type: 'COWORK_REQUEST_SYNC'; payload: any; senderId: string; receiverId: string }
  | { type: 'COWORK_ACCEPTED_SYNC'; payload: any; userId?: string }
  | { type: 'COWORK_ORBIT_SYNC'; payload: { attachedFriendIds: string[] }; userId: string }
  | { type: 'COWORK_DISCONNECT_SYNC'; payload: { targetFriendId: string }; userId: string }
  | { type: 'FRIEND_TIMER_SYNC'; payload: any; friendUserId: string; targetUserId?: string }
  | { type: 'TIMER_EVENT_SYNC'; payload: any; friendUserId: string; targetUserId?: string }
  | { type: 'USER_COLOR_SYNC'; payload: { userId: string; themeColor: string }; userId?: string }
  | { type: 'FRIEND_REQUEST_SYNC'; payload: any; userId?: string };

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
