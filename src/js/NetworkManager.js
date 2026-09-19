import Peer from 'peerjs';

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
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      const randomId = Math.random().toString(36).substring(2, 8);
      this.roomId = `fantasy-${randomId}`;
      this.isHost = true;
      this.isLocalReady = false;
      this.isRemoteReady = false;

      try {
        this.peer = new Peer(this.roomId);
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
        this.gameController.gamePlay.showMessage(`Ошибка сети: ${err.type || err.message}`);
      });
    });
  }

  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomId = roomId;
      this.isLocalReady = false;
      this.isRemoteReady = false;
      const guestId = `guest-${Math.random().toString(36).substring(2, 8)}`;

      try {
        this.peer = new Peer(guestId);
      } catch (err) {
        reject(err);
        return;
      }

      this.peer.on('open', () => {
        const conn = this.peer.connect(this.roomId, { reliable: true });
        this.conn = conn;
        this.setupConnection();
        resolve();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Guest Error:', err);
        reject(err);
      });
    });
  }

  setupConnection() {
    this.conn.on('open', () => {
      this.isConnected = true;
      this.gameController.onNetworkConnected(this.isHost);
    });

    this.conn.on('data', (data) => {
      this.gameController.onNetworkMessage(data);
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      this.gameController.onNetworkDisconnected();
    });

    this.conn.on('error', (err) => {
      console.error('Peer connection error:', err);
    });
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
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isConnected = false;
    this.isLocalReady = false;
    this.isRemoteReady = false;
  }
}
