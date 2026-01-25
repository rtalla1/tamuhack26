import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Global socket server instance
let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    // @ts-ignore - Next.js server instance
    const httpServer: HTTPServer = (req as any).socket?.server;
    
    if (!httpServer) {
      return new Response(
        JSON.stringify({ error: 'HTTP server not available' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/biometrics/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      // iOS app joins a session room
      socket.on('join-session', (sessionId: string) => {
        socket.join(sessionId);
        console.log(`📱 iOS joined session: ${sessionId}`);
        
        // Notify web client that iOS is connected
        io?.to(sessionId).emit('ios-connected', {
          status: 'connected',
          timestamp: Date.now(),
        });
      });

      // iOS sends biometric data
      socket.on('biometric-update', (data: {
        sessionId: string;
        heartRate: number;
        breathingRate: number;
        stressScore: number;
        confidence?: number;
        timestamp: number;
      }) => {
        console.log(`💓 Biometric update for ${data.sessionId}:`, {
          hr: data.heartRate,
          br: data.breathingRate,
          stress: data.stressScore,
        });

        // Broadcast to all clients in this session room
        io?.to(data.sessionId).emit('stress-update', {
          heartRate: data.heartRate,
          breathingRate: data.breathingRate,
          stressScore: data.stressScore,
          confidence: data.confidence || 1.0,
          timestamp: data.timestamp,
          source: 'ios',
        });
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
  }

  return new Response(
    JSON.stringify({ 
      status: 'Socket.IO server running',
      path: '/api/biometrics/socket',
    }), 
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
