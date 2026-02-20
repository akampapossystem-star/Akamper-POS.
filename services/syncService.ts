
export type SyncActionType = 
  | 'ORDER_NEW' 
  | 'ORDER_UPDATE' 
  | 'PRODUCT_UPDATE' 
  | 'STOCK_LOG'
  | 'TABLE_UPDATE'
  | 'REQUISITION_UPDATE'
  | 'REQUEST_FULL_SYNC'
  | 'FULL_SYNC_PAYLOAD'
  | 'CHAT_MESSAGE'
  | 'TYPING_EVENT'
  | 'MESSAGE_READ'
  | 'KITCHEN_CALL'
  | 'PRESENCE_HEARTBEAT';

export interface SyncMessage {
  type: SyncActionType;
  payload: any;
  timestamp: number;
  senderId: string;
  tenantId: string; // New: Explicit tenant scoping
}

const INSTANCE_ID = Math.random().toString(36).substr(2, 9);
const WS_URL = 'wss://api.akampapos.cloud/realtime';

class RealtimeService {
  private bc: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();
  private reconnectInterval: number = 3000;
  private isConnected: boolean = false;
  private currentTenantId: string = 'GLOBAL';

  constructor() {
    this.connectWebSocket();
  }

  /**
   * Initializes the channel for a specific tenant.
   * This is called when a user logs in or a master owner switches views.
   */
  public initTenantChannel(tenantId: string) {
    if (this.bc) this.bc.close();
    this.currentTenantId = tenantId;
    this.bc = new BroadcastChannel(`akampa_pos_${tenantId}`);
    this.bc.onmessage = (event) => this.handleMessage(event.data);
    console.log(`[Realtime] Channel Isolated for Tenant: ${tenantId}`);
  }

  private connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Strict filtering at the client side if the server is a broadcast relay
          if (msg.tenantId === this.currentTenantId) {
              this.handleMessage(msg);
          }
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };

    } catch (e) {
      setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public publish(type: SyncActionType, payload: any) {
    const msg: SyncMessage = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: INSTANCE_ID,
      tenantId: this.currentTenantId
    };

    if (this.bc) this.bc.postMessage(msg);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: SyncMessage) {
    if (msg.senderId === INSTANCE_ID) return;
    if (msg.tenantId !== this.currentTenantId) return; // Final fallback filter
    this.listeners.forEach(listener => listener(msg));
  }

  public close() {
    if (this.bc) this.bc.close();
    if (this.ws) this.ws.close();
  }
}

const service = new RealtimeService();

export const initSync = (onMessage: (msg: SyncMessage) => void, tenantId: string) => {
  service.initTenantChannel(tenantId);
  return service.subscribe(onMessage);
};

export const broadcast = (type: SyncActionType, payload: any) => {
  service.publish(type, payload);
};

export const closeSync = () => {
  service.close();
};
