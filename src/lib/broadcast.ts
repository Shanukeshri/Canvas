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
  | { type: 'FRIEND_REQUEST_SYNC'; payload: any; userId?: string }
  | { type: 'GROUP_INVITE_SYNC'; payload: any; receiverId?: string; userId?: string }
  | { type: 'GROUP_MEMBER_JOINED_SYNC'; payload: any; groupId?: string; userId?: string }
  | { type: 'GROUP_MEMBER_DISCONNECTED_SYNC'; payload: any; groupId?: string; userId?: string }
  | { type: 'LEADER_PING'; tabId: string }
  | { type: 'LEADER_PONG'; tabId: string }
  | { type: 'LEADER_HEARTBEAT'; tabId: string };

class CanvasBroadcastChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: TabSyncMessage) => void> = new Set();
  public tabId: string = Math.random().toString(36).substring(2, 9);

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('canvas_tabs_sync');
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

export const CanvasBroadcastChannelClass = CanvasBroadcastChannel;
export const ZenBroadcastChannel = CanvasBroadcastChannel;
export const tabSync = new CanvasBroadcastChannel();

class LeaderElection {
  public isLeader = false;
  private checkInterval: any = null;
  private heartbeatInterval: any = null;
  private lastLeaderHeartbeat = 0;
  private unsub: (() => void) | null = null;
  private leaderChangeListeners = new Set<(isLeader: boolean) => void>();

  constructor() {
    if (typeof window === 'undefined') return;
    
    this.unsub = tabSync.subscribe((msg) => {
      if (msg.type === 'LEADER_PING') {
        if (this.isLeader) {
          tabSync.publish({ type: 'LEADER_PONG', tabId: tabSync.tabId });
        }
      } else if (msg.type === 'LEADER_PONG' || msg.type === 'LEADER_HEARTBEAT') {
        this.lastLeaderHeartbeat = Date.now();
        if (this.isLeader && msg.tabId !== tabSync.tabId) {
          // Collision: step down
          this.setLeader(false);
        }
      }
    });

    this.startElectionProcess();
  }

  private setLeader(status: boolean) {
    if (this.isLeader !== status) {
      this.isLeader = status;
      this.leaderChangeListeners.forEach(l => l(status));
      if (status) {
        this.startHeartbeat();
      } else {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      }
    }
  }

  public subscribe(listener: (isLeader: boolean) => void) {
    this.leaderChangeListeners.add(listener);
    listener(this.isLeader); // fire immediately
    return () => this.leaderChangeListeners.delete(listener);
  }

  private startElectionProcess() {
    // Check for existing leader
    tabSync.publish({ type: 'LEADER_PING', tabId: tabSync.tabId });
    
    // Wait for pong
    setTimeout(() => {
      if (Date.now() - this.lastLeaderHeartbeat > 500) {
        this.setLeader(true);
      }
    }, 300);

    // Periodically check if leader died
    this.checkInterval = setInterval(() => {
      if (!this.isLeader) {
        if (Date.now() - this.lastLeaderHeartbeat > 3000) {
          // Leader died, take over
          this.setLeader(true);
        }
      }
    }, 2000);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      tabSync.publish({ type: 'LEADER_HEARTBEAT', tabId: tabSync.tabId });
    }, 1500);
  }
}

export const leaderElection = new LeaderElection();
