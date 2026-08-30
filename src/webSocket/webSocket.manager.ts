import { WebSocket } from "ws";

class WebSocketManager {
  private connections = new Map<string, WebSocket>();

  /**
   * Register a user's WebSocket connection
   */
  addConnection(userId: string, socket: WebSocket): void {
    // Check if user already has an existing connection
    const existingSocket = this.connections.get(userId);

    if (existingSocket && existingSocket !== socket) {
      console.log(`Replacing existing WebSocket connection for user: ${userId}`);

      if (existingSocket.readyState === WebSocket.OPEN) {
        existingSocket.close(1000, "New connection established");
      }
    }

    this.connections.set(userId, socket);

    console.log(`WebSocket connected for user: ${userId}`);
    console.log("Connected users:", this.getConnectedUserIds());
  }

  /**
   * Remove a user's WebSocket connection
   */
  removeConnection(userId: string, socket?: WebSocket): void {
    const existingSocket = this.connections.get(userId);

    // Only remove the connection if it is the same socket.
    // This prevents an old socket's "close" event from
    // removing a newer connection.
    if (socket && existingSocket !== socket) {
      return;
    }

    this.connections.delete(userId);

    console.log(`WebSocket disconnected for user: ${userId}`);
    console.log("Connected users:", this.getConnectedUserIds());
  }

  /**
   * Send a message to a specific user
   */
  sendToUser(userId: string, message: unknown): void {
    const socket = this.connections.get(userId);

    // User is not connected
    if (!socket) {
      console.log(`User ${userId} is not connected`);
      return;
    }

    // Socket exists but is not open
    if (socket.readyState !== WebSocket.OPEN) {
      console.log(`WebSocket is not open for user: ${userId}`);

      // Remove stale connection
      this.connections.delete(userId);

      return;
    }

    // Send notification
    socket.send(JSON.stringify(message));

    console.log(`WebSocket message sent to user: ${userId}`);
  }

  /**
   * Check whether a user is connected
   */
  isUserConnected(userId: string): boolean {
    const socket = this.connections.get(userId);

    return socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of connected users
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }
}

export const websocketManager = new WebSocketManager();
