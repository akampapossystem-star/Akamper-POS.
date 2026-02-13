
// Mock Cloud API Endpoint - In production, this would be process.env.API_URL
const CLOUD_API_BASE = 'https://api.akampapos.cloud/v1';

const BUFFER_KEY = 'akampa_offline_buffer';

interface BufferedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Helper: Get Queue
const getBuffer = (): BufferedRequest[] => {
  try {
    const stored = localStorage.getItem(BUFFER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper: Save Queue
const saveBuffer = (queue: BufferedRequest[]) => {
  localStorage.setItem(BUFFER_KEY, JSON.stringify(queue));
};

/**
 * Core function to handle the Stateless Cloud transition.
 * Tries to send immediately. If fails or offline, buffers to local disk.
 */
export const pushTransaction = async (endpoint: string, payload: any, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<boolean> => {
  
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      console.log(`[CLOUD SYNC] Attempting ${method} to ${endpoint}...`);
      
      // --- SIMULATION OF NETWORK CALL ---
      // In a real app, use: await fetch(`${CLOUD_API_BASE}${endpoint}`, { method, body: JSON.stringify(payload), ... });
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
      
      console.log(`[CLOUD SYNC] Success: Data persisted to Remote DB.`);
      return true;
    } catch (error) {
      console.error(`[CLOUD SYNC] Failed. Reverting to Buffer.`, error);
      // Fallthrough to buffer logic
    }
  }

  // --- OFFLINE BUFFER LOGIC ---
  console.warn(`[OFFLINE] Buffering transaction for ${endpoint}`);
  
  const buffer = getBuffer();
  const request: BufferedRequest = {
    id: crypto.randomUUID(),
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  };

  buffer.push(request);
  saveBuffer(buffer);
  return false; // Indicates it was buffered, not sent live
};

/**
 * Flushes the local storage buffer to the cloud.
 * Called automatically when connection restores.
 */
export const flushBuffer = async () => {
  const buffer = getBuffer();
  if (buffer.length === 0) return;

  console.log(`[CLOUD SYNC] Flushing ${buffer.length} buffered transactions...`);

  const remainingBuffer: BufferedRequest[] = [];

  for (const req of buffer) {
    try {
      // Simulate Retry
      console.log(`[CLOUD SYNC] Retrying buffered item: ${req.endpoint}`);
      await new Promise(resolve => setTimeout(resolve, 500)); 
      // Success - do not add back to remainingBuffer
    } catch (e) {
      // Failed again, keep in buffer
      req.retryCount++;
      remainingBuffer.push(req);
    }
  }

  saveBuffer(remainingBuffer);
  
  if (remainingBuffer.length === 0) {
    console.log(`[CLOUD SYNC] Buffer cleared. All data is on the Cloud.`);
  } else {
    console.warn(`[CLOUD SYNC] ${remainingBuffer.length} items failed to sync. Will retry later.`);
  }
};

/**
 * Returns the number of items currently waiting in the local buffer.
 */
export const getBufferSize = (): number => {
  return getBuffer().length;
};
