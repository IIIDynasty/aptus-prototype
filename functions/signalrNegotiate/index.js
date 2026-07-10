/* ============================================
   Azure Function: SignalR Negotiate
   HTTP Trigger for SignalR connection info
   ============================================ */

module.exports = async function (context, req) {
  context.log('SignalR negotiate request');

  // Return SignalR connection info
  context.res = {
    body: context.bindings.signalRConnectionInfo
  };
};
