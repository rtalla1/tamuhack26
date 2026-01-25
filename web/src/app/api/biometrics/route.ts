// This API route is now handled by the custom server (server.js)
// Socket.IO is initialized there instead of here

export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'Socket.IO server running (via custom server)',
      path: '/api/biometrics/socket',
      note: 'Socket.IO is initialized in server.js'
    }), 
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
