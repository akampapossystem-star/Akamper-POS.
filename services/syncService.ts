
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
  | 'PRESENCE_HEARTBEAT'; // New action for Online Status

export interface SyncMessage {
  type: SyncActionType;
  payload: any;
  timestamp: number;
  senderId: string;
}

const CHANNEL_NAME = 'akampa_pos_realtime_v1';
const INSTANCE_ID = Math.random().toString(36).substr(2, 9);
const WS_URL = 'wss://api.akampapos.cloud/realtime'; // Production Endpoint

class RealtimeService {
  private bc: BroadcastChannel;
  private ws: WebSocket | null = null;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();
  private reconnectInterval: number = 3000;
  private isConnected: boolean = false;

  constructor() {
    // 1. Initialize Local Broadcast (Tab-to-Tab)
    this.bc = new BroadcastChannel(CHANNEL_NAME);
    this.bc.onmessage = (event) => this.handleMessage(event.data);

    // 2. Initialize WebSocket (Device-to-Device)
    this.connectWebSocket();

    console.log(`[Realtime] Initialized Client ID: ${INSTANCE_ID}`);
  }

  private connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('[WS] Connected to Cloud Relay');
        this.isConnected = true;
        // Optional: Send handshake or auth if needed
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      this.ws.onclose = () => {
        if (this.isConnected) {
            console.warn('[WS] Disconnected. Retrying...');
        }
        this.isConnected = false;
        this.ws = null;
        setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        // Silent error log to avoid console spam in dev without server
        // console.debug('[WS] Error:', err); 
        this.ws?.close();
      };

    } catch (e) {
      console.warn('[WS] Offline Mode - Using Local Broadcast');
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
      senderId: INSTANCE_ID
    };

    // 1. Send to Local Tabs via BroadcastChannel
    this.bc.postMessage(msg);

    // 2. Send to Cloud via WebSocket (if connected)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: SyncMessage) {
    // Prevent echo loops (ignore messages sent by self)
    if (msg.senderId === INSTANCE_ID) return;
    
    // Notify subscribers
    this.listeners.forEach(listener => listener(msg));
  }

  public close() {
    this.bc.close();
    if (this.ws) this.ws.close();
  }
}

// Singleton Instance
const service = new RealtimeService();

// Export Adapter Functions to match existing API
export const initSync = (onMessage: (msg: SyncMessage) => void) => {
  return service.subscribe(onMessage);
};

export const broadcast = (type: SyncActionType, payload: any) => {
  service.publish(type, payload);
};

export const closeSync = () => {
  service.close();
};
