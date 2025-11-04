const setupSocket = (io) => {
    // Track connected users
    let connectedUsers = 0;
  
    io.on('connection', (socket) => {
      connectedUsers++;
      console.log(`✅ Client connected: ${socket.id} (Total: ${connectedUsers})`);
  
      // Send initial connection success
      socket.emit('connected', { 
        message: 'Connected to Vibes Lounge server',
        socketId: socket.id 
      });
  
      // Handle disconnection
      socket.on('disconnect', () => {
        connectedUsers--;
        console.log(`❌ Client disconnected: ${socket.id} (Total: ${connectedUsers})`);
      });
  
      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  
    return io;
  };
  
  // Helper functions to emit events
  const emitSaleCreated = (io, saleData) => {
    io.emit('sale:created', saleData);
    console.log('📢 Emitted sale:created event');
  };
  
  const emitStockUpdated = (io, productData) => {
    io.emit('stock:updated', productData);
    console.log('📢 Emitted stock:updated event');
  };
  
  const emitProfitUpdated = (io, profitData) => {
    io.emit('profit:updated', profitData);
    console.log('📢 Emitted profit:updated event');
  };
  
  const emitTabCreated = (io, tabData) => {
    io.emit('tab:created', tabData);
    console.log('📢 Emitted tab:created event');
  };
  
  const emitTabUpdated = (io, tabData) => {
    io.emit('tab:updated', tabData);
    console.log('📢 Emitted tab:updated event');
  };
  
  const emitProductUpdated = (io, productData) => {
    io.emit('product:updated', productData);
    console.log('📢 Emitted product:updated event');
  };
  
  module.exports = {
    setupSocket,
    emitSaleCreated,
    emitStockUpdated,
    emitProfitUpdated,
    emitTabCreated,
    emitTabUpdated,
    emitProductUpdated,
  };