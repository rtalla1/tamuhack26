const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    path: '/api/biometrics/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Web client joins a session room (just to receive updates)
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      console.log(`🌐 Web client joined session: ${sessionId}`);
    });

    // iOS app explicitly registers as an iOS device
    socket.on('ios-join-session', (sessionId) => {
      socket.join(sessionId);
      socket.data.isIOS = true;
      socket.data.sessionId = sessionId;
      console.log(`📱 iOS device joined session: ${sessionId}`);
      
      // Notify web client that iOS is connected
      io.to(sessionId).emit('ios-connected', {
        status: 'connected',
        timestamp: Date.now(),
      });
    });

    // iOS sends calibration status
    socket.on('calibration-update', (data) => {
      const statusIcon = data.isCalibrating ? '⏳' : '✅';
      console.log(`${statusIcon} SERVER received calibration-update for ${data.sessionId}:`, {
        isCalibrating: data.isCalibrating,
        progress: data.progress,
      });

      // Broadcast to all clients in this session room
      io.to(data.sessionId).emit('calibration-update', {
        isCalibrating: data.isCalibrating,
        progress: data.progress,
        timestamp: data.timestamp,
      });
      
      console.log(`${statusIcon} SERVER broadcasted to session room: ${data.sessionId}`);
    });

    // iOS sends biometric data
    socket.on('biometric-update', (data) => {
      console.log(`💓 Biometric update for ${data.sessionId}:`, {
        hr: data.heartRate,
        br: data.breathingRate,
        stress: data.stressScore,
        amplitude: data.breathingAmplitude,
        talking: data.isTalking,
      });

      // Broadcast to all clients in this session room
      io.to(data.sessionId).emit('stress-update', {
        heartRate: data.heartRate,
        breathingRate: data.breathingRate,
        stressScore: data.stressScore,
        confidence: data.confidence || 1.0,
        breathingAmplitude: data.breathingAmplitude || 0,
        isTalking: data.isTalking || false,
        isBlinking: data.isBlinking || false,
        timestamp: data.timestamp,
        source: 'ios',
      });
    });

    // Web client signals that negotiation has ended
    socket.on('end-negotiation', (sessionId) => {
      console.log(`🏁 Negotiation ended for session: ${sessionId}`);
      // Notify all clients (including iOS) in this session
      io.to(sessionId).emit('negotiation-ended', {
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      
      // If an iOS device disconnects, notify the session
      if (socket.data.isIOS && socket.data.sessionId) {
        io.to(socket.data.sessionId).emit('ios-disconnected', {
          status: 'disconnected',
          timestamp: Date.now(),
        });
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO ready on path: /api/biometrics/socket`);
    });
});
