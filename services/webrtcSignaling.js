// WebRTC Signaling Service for Live Streaming
// Handles peer connection signaling between broadcasters and viewers

const activeStreams = new Map(); // streamId -> { broadcaster, viewers: Set }

function setupWebRTCSignaling(io) {
  console.log('🎥 WebRTC Signaling Server initialized');

  io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Broadcaster starts streaming
    socket.on('start-stream', ({ streamId, userId, userName }) => {
      console.log(`🎬 ${userName} started stream:`, streamId);
      
      activeStreams.set(streamId, {
        broadcaster: socket.id,
        userId,
        userName,
        viewers: new Set(),
        startTime: Date.now()
      });

      socket.join(streamId);
      socket.emit('stream-started', { streamId });
      
      // Notify all clients about new stream
      io.emit('stream-list-updated', getActiveStreamsList());
    });

    // Viewer joins stream
    socket.on('join-stream', ({ streamId, userId, userName }) => {
      const stream = activeStreams.get(streamId);
      
      if (!stream) {
        socket.emit('stream-error', { message: 'Stream not found' });
        return;
      }

      console.log(`👁️ ${userName} joined stream:`, streamId);
      
      stream.viewers.add(socket.id);
      socket.join(streamId);

      // Notify broadcaster about new viewer
      io.to(stream.broadcaster).emit('viewer-joined', {
        viewerId: socket.id,
        userId,
        userName,
        viewerCount: stream.viewers.size
      });

      // Send offer to connect
      socket.emit('stream-ready', {
        streamId,
        broadcaster: stream.broadcaster
      });

      // Update viewer count for everyone
      io.to(streamId).emit('viewer-count-updated', {
        count: stream.viewers.size
      });
    });

    // WebRTC offer from broadcaster
    socket.on('offer', ({ offer, viewerId }) => {
      console.log('📤 Sending offer to viewer:', viewerId);
      io.to(viewerId).emit('offer', {
        offer,
        broadcaster: socket.id
      });
    });

    // WebRTC answer from viewer
    socket.on('answer', ({ answer, broadcaster }) => {
      console.log('📥 Sending answer to broadcaster:', broadcaster);
      io.to(broadcaster).emit('answer', {
        answer,
        viewer: socket.id
      });
    });

    // ICE candidate exchange
    socket.on('ice-candidate', ({ candidate, targetId }) => {
      console.log('🧊 Forwarding ICE candidate');
      io.to(targetId).emit('ice-candidate', {
        candidate,
        sender: socket.id
      });
    });

    // Chat message in stream
    socket.on('stream-message', ({ streamId, message, userId, userName }) => {
      const stream = activeStreams.get(streamId);
      
      if (stream) {
        io.to(streamId).emit('stream-message', {
          message,
          userId,
          userName,
          timestamp: Date.now()
        });
      }
    });

    // Like stream
    socket.on('stream-like', ({ streamId, userId }) => {
      const stream = activeStreams.get(streamId);
      
      if (stream) {
        io.to(streamId).emit('stream-like', {
          userId,
          timestamp: Date.now()
        });
      }
    });

    // End stream
    socket.on('end-stream', ({ streamId }) => {
      const stream = activeStreams.get(streamId);
      
      if (stream && stream.broadcaster === socket.id) {
        console.log('🛑 Stream ended:', streamId);
        
        // Notify all viewers
        io.to(streamId).emit('stream-ended');
        
        // Cleanup
        activeStreams.delete(streamId);
        io.emit('stream-list-updated', getActiveStreamsList());
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('📴 Client disconnected:', socket.id);
      
      // Check if disconnected user was broadcaster
      for (const [streamId, stream] of activeStreams.entries()) {
        if (stream.broadcaster === socket.id) {
          console.log('🛑 Broadcaster disconnected, ending stream:', streamId);
          io.to(streamId).emit('stream-ended');
          activeStreams.delete(streamId);
          io.emit('stream-list-updated', getActiveStreamsList());
        } else if (stream.viewers.has(socket.id)) {
          // Remove viewer
          stream.viewers.delete(socket.id);
          io.to(streamId).emit('viewer-count-updated', {
            count: stream.viewers.size
          });
        }
      }
    });

    // Get list of active streams
    socket.on('get-active-streams', () => {
      socket.emit('stream-list', getActiveStreamsList());
    });
  });

  // Helper function to get active streams list
  function getActiveStreamsList() {
    const streams = [];
    
    for (const [streamId, stream] of activeStreams.entries()) {
      streams.push({
        streamId,
        userId: stream.userId,
        userName: stream.userName,
        viewerCount: stream.viewers.size,
        duration: Date.now() - stream.startTime
      });
    }
    
    return streams;
  }
}

module.exports = { setupWebRTCSignaling };
