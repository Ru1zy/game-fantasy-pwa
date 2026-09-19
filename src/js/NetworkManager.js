import Peer from 'peerjs';

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  },
  debug: 1,
};

export default class NetworkManager {
  constructor(gameController) {
    this.gameController = gameController;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomId = null;
    this.isConnected = false;
    this.isLocalReady = false;
    this.isRemoteReady = false;
    this.heartbeatTimer = null;
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      this.disconnect();
      const randomId = Math.random().toString(36).substring(2, 8);
      this.roomId = `fantasy-${randomId}`;
      this.isHost = true;
      this.isLocalReady = false;
      this.isRemoteReady = false;

      try {
        this.peer = new Peer(this.roomId, PEER_CONFIG);
      } catch (err) {
        reject(err);
        return;
      }

      this.peer.on('open', (id) => {
        this.roomId = id;
        resolve(this.getShareableUrl());
      });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Host Error:', err);
      });
    });
  }

  joinRoom(roomId, onProgress = null) {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = false;
      this.roomId = roomId;
      this.isLocalReady = false;
      this.isRemoteReady = false;

      let attempt = 0;
      const maxAttempts = 6;
      let isSettled = false;
      let attemptTimeout = null;

      const guestId = `guest-${Math.random().toString(36).substring(2, 8)}`;

      try {
        this.peer = new Peer(guestId, PEER_CONFIG);
      } catch (err) {
        reject(err);
        return;
      }

      const tryConnect = () => {
        if (isSettled) return;
        attempt += 1;
        if (onProgress) onProgress(attempt, maxAttempts);

        if (this.conn) {
          try { this.conn.close(); } catch (e) {}
        }

        const conn = this.peer.connect(this.roomId, {
          reliable: true,
        });
        this.conn = conn;

        attemptTimeout = setTimeout(() => {
          if (!isSettled) {
            if (attempt < maxAttempts) {
              console.log(`Connection attempt ${attempt} timed out, retrying...`);
              tryConnect();
            } else {
              isSettled = true;
              reject(new Error('Время ожидания подключения истекло'));
            }
          }
        }, 4000);

        const handleOpen = () => {
          if (attemptTimeout) clearTimeout(attemptTimeout);
          if (!isSettled) {
            isSettled = true;
            this.setupConnection();
            resolve();
          }
        };

        if (conn.open) {
          handleOpen();
        } else {
          conn.on('open', handleOpen);
        }

        conn.on('error', (err) => {
          console.warn(`Attempt ${attempt} connection error:`, err);
        });
      };

      this.peer.on('open', () => {
        tryConnect();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Guest Error:', err);
        if (err.type === 'peer-unavailable' && attempt < maxAttempts && !isSettled) {
          if (attemptTimeout) clearTimeout(attemptTimeout);
          setTimeout(() => {
            if (!isSettled) tryConnect();
          }, 1500);
        } else if (!isSettled && attempt >= maxAttempts) {
          isSettled = true;
          if (attemptTimeout) clearTimeout(attemptTimeout);
          reject(err);
        }
      });
    });
  }

  setupConnection() {
    const handleOpen = () => {
      this.isConnected = true;
      this.startHeartbeat();
      this.gameController.onNetworkConnected(this.isHost);
    };

    if (this.conn.open) {
      handleOpen();
    } else {
      this.conn.on('open', handleOpen);
    }

    this.conn.on('data', (data) => {
      if (data && data.type === 'ping') {
        this.send({ type: 'pong' });
        return;
      }
      if (data && data.type === 'pong') {
        return;
      }
      this.gameController.onNetworkMessage(data);
    });

    this.conn.on('close', () => {
      this.stopHeartbeat();
      this.isConnected = false;
      this.gameController.onNetworkDisconnected();
    });

    this.conn.on('error', (err) => {
      console.error('Peer connection error:', err);
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.conn && this.conn.open) {
        this.conn.send({ type: 'ping' });
      }
    }, 4000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  getShareableUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomId);
    return url.toString();
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.isConnected = false;
    this.isLocalReady = false;
    this.isRemoteReady = false;
  }
}
