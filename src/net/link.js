// The connection between friends' games: one player hosts a room, the others join it with its
// six-digit code. Players link straight to each other (WebRTC, through the free PeerJS broker for
// the handshake), so there is no game server to run. Everyone talks to the host, and the host
// passes each message on to the rest.
//
// `?net=local` in the address swaps the internet for a BroadcastChannel, so two tabs of the same
// browser can play together (for testing without a network).

const PREFIX = 'tengu-pastel-room-';
const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';

let loading = null;
function loadPeerJs() {
  if (globalThis.Peer) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEERJS;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('Could not reach the internet'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const localMode = () => globalThis.TENGU_NET_LOCAL || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('net') === 'local');

// A link: { id, host, send(msg), close() }, calling handlers.onMessage(msg, fromId),
// handlers.onPeer(id, joined), handlers.onClose(reason). Messages are plain JSON objects.
export function openLink(code, asHost, handlers) {
  return localMode() ? localLink(code, asHost, handlers) : peerLink(code, asHost, handlers);
}

function peerLink(code, asHost, handlers) {
  const link = { id: null, host: asHost, peers: new Map(), closed: false, ready: false };
  let peer = null;
  const fail = (why) => {
    if (link.closed) return;
    link.close();
    handlers.onClose(why);
  };
  // To everyone else (the host fans it out; a guest only knows the host).
  link.send = (msg, except = null) => {
    const raw = JSON.stringify(msg);
    for (const [id, conn] of link.peers) if (id !== except && conn.open) conn.send(raw);
  };
  link.sendTo = (id, msg) => {
    const conn = link.peers.get(id);
    if (conn?.open) conn.send(JSON.stringify(msg));
  };
  link.close = () => {
    link.closed = true;
    for (const c of link.peers.values()) c.close();
    peer?.destroy();
  };
  const wire = (conn) => {
    conn.on('open', () => {
      link.peers.set(conn.peer, conn);
      handlers.onPeer(conn.peer, true);
    });
    conn.on('data', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      // The host passes everything on to the others.
      if (link.host) link.send(msg, conn.peer);
      handlers.onMessage(msg, conn.peer);
    });
    conn.on('close', () => {
      link.peers.delete(conn.peer);
      handlers.onPeer(conn.peer, false);
      if (!link.host) fail('The host left the room');
    });
    conn.on('error', () => {});
  };
  loadPeerJs().then(() => {
    if (link.closed) return;
    peer = asHost ? new globalThis.Peer(PREFIX + code) : new globalThis.Peer();
    peer.on('open', (id) => {
      link.id = asHost ? code : id;
      link.ready = true;
      if (asHost) handlers.onReady?.();
      else {
        const conn = peer.connect(PREFIX + code, { reliable: true });
        wire(conn);
        conn.on('open', () => handlers.onReady?.());
      }
    });
    if (asHost) peer.on('connection', wire);
    peer.on('error', (e) => {
      if (e.type === 'peer-unavailable') fail('No room with that code');
      else if (e.type === 'unavailable-id') fail('That room code is taken, try again');
      else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') fail('Could not reach the internet');
      else if (!link.ready) fail('Could not connect');
    });
    peer.on('disconnected', () => {
      // Lost the broker only: open links keep working, so just try to get it back.
      if (!link.closed) peer.reconnect?.();
    });
  }, (e) => fail(e.message));
  // A guest that hears nothing back gives up after a while.
  if (!asHost) {
    setTimeout(() => {
      if (!link.closed && !link.peers.size) fail('No room with that code');
    }, 15000);
  }
  return link;
}

// Same shape over a BroadcastChannel (tabs of one browser).
function localLink(code, asHost, handlers) {
  const ch = new BroadcastChannel(PREFIX + code);
  const id = asHost ? code : `g${Math.floor(Math.random() * 1e9)}`;
  const link = { id, host: asHost, peers: new Map(), closed: false, ready: true };
  const post = (data) => ch.postMessage(data);
  link.send = (msg, except = null) => post({ from: id, except, to: null, msg });
  link.sendTo = (to, msg) => post({ from: id, to, msg });
  link.close = () => {
    if (link.closed) return;
    post({ from: id, bye: true });
    link.closed = true;
    ch.close();
  };
  ch.onmessage = ({ data }) => {
    if (link.closed || data.from === id) return;
    const fromHost = data.from === code;
    // A guest only hears the host, the host hears its guests: the same star as over the internet.
    if (!asHost && !fromHost) return;
    if (asHost && data.hello && !link.peers.has(data.from)) {
      link.peers.set(data.from, true);
      handlers.onPeer(data.from, true);
      post({ from: id, to: data.from, welcome: true });
      return;
    }
    if (!asHost && data.welcome && data.to === id) {
      link.peers.set(code, true);
      handlers.onPeer(code, true);
      handlers.onReady?.();
      return;
    }
    if (data.bye) {
      if (!link.peers.has(data.from)) return;
      link.peers.delete(data.from);
      handlers.onPeer(data.from, false);
      if (!asHost) {
        link.close();
        handlers.onClose('The host left the room');
      }
      return;
    }
    if (!data.msg || (data.to && data.to !== id) || data.except === id) return;
    if (asHost) link.send(data.msg, data.from);
    handlers.onMessage(data.msg, data.from);
  };
  if (asHost) setTimeout(() => handlers.onReady?.(), 0);
  else {
    post({ from: id, hello: true });
    setTimeout(() => {
      if (!link.closed && !link.peers.size) {
        link.close();
        handlers.onClose('No room with that code');
      }
    }, 3000);
  }
  return link;
}
