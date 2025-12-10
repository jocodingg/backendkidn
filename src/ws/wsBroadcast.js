let wss = null;
function init(wssInstance) {
  wss = wssInstance;
}
function broadcast(message) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}
module.exports = { init, broadcast };