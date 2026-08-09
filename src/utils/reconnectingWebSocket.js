// Simple reconnecting WebSocket helper with exponential backoff.
// Usage:
// const ws = createReconnectingWebSocket(url, protocols, {onOpen, onMessage, onClose, onError});
// ws.send(...); ws.close();

export function createReconnectingWebSocket(url, protocols = null, options = {}) {
  const {
    maxRetries = 10,
    initialDelay = 1000,
    maxDelay = 30000,
    debug = false,
    onOpen = () => {},
    onClose = () => {},
    onMessage = () => {},
    onError = () => {},
  } = options;

  let socket = null;
  let retries = 0;
  let manuallyClosed = false;
  let connectTimer = null;

  const create = () => {
    if (manuallyClosed) return;
    if (debug) console.debug('[rws] connecting', { url, retries });
    socket = protocols ? new WebSocket(url, protocols) : new WebSocket(url);

    socket.addEventListener('open', (ev) => {
      retries = 0;
      if (debug) console.debug('[rws] open');
      onOpen(ev);
    });

    socket.addEventListener('message', (ev) => {
      try { onMessage(ev); } catch (e) { if (debug) console.debug('[rws] onMessage handler error', e); }
    });

    socket.addEventListener('error', (ev) => {
      try { onError(ev); } catch (e) { if (debug) console.debug('[rws] onError handler error', e); }
    });

    socket.addEventListener('close', (ev) => {
      try { onClose(ev); } catch (e) { if (debug) console.debug('[rws] onClose handler error', e); }
      if (manuallyClosed) return;
      // schedule reconnect with exponential backoff
      retries += 1;
      if (retries > maxRetries) {
        if (debug) console.debug('[rws] max retries reached, giving up');
        return;
      }
      const delay = Math.min(maxDelay, initialDelay * Math.pow(2, retries - 1));
      if (debug) console.debug('[rws] reconnecting in', delay);
      connectTimer = setTimeout(() => create(), delay);
    });
  };

  create();

  return {
    send(data) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
        return true;
      }
      if (debug) console.debug('[rws] send failed; socket not open');
      return false;
    },
    close() {
      manuallyClosed = true;
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      if (socket) {
        try { socket.close(); } catch {}
      }
    },
    raw() {
      return socket;
    }
  };
}

// Expose a factory on window for quick debugging usage from console or other scripts
try {
  if (typeof window !== 'undefined') {
    window.createReconnectingWebSocket = createReconnectingWebSocket;
  }
} catch {}
