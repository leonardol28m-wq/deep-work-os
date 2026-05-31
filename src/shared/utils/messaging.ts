// ============================================================
// Deep Work OS — Chrome Message Helpers
// ============================================================

import type { Message, MessageResponse } from '../../types';

export function sendMessage<T = unknown>(message: Message): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

export function onStateChange(callback: () => void): () => void {
  const listener = () => callback();
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
