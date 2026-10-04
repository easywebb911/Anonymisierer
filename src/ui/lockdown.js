// Netzwerksperre (zusätzlich zur Content-Security-Policy): Alle Wege, über die eine Webseite Daten
// senden oder nachladen könnte, werden vor dem Laden der Bibliotheken unbrauchbar gemacht.
const blocked = (name) => function () { throw new Error('Offline-Modus: ' + name + ' ist gesperrt.'); };
const g = globalThis;
for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'RTCPeerConnection',
  'webkitRTCPeerConnection', 'WebTransport', 'BroadcastChannel']) {
  try { Object.defineProperty(g, name, { value: blocked(name), writable: false, configurable: false }); } catch { /* nicht vorhanden */ }
}
try { Object.defineProperty(g, 'open', { value: blocked('window.open'), writable: false, configurable: false }); } catch { /* egal */ }
if (g.navigator) {
  try { Object.defineProperty(g.navigator, 'sendBeacon', { value: blocked('sendBeacon'), configurable: false }); } catch { /* egal */ }
  try { if (g.navigator.serviceWorker) Object.defineProperty(g.navigator, 'serviceWorker', { value: undefined, configurable: false }); } catch { /* egal */ }
}
