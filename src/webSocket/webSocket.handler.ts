import { Server as HttpServer } from "http";
import { URL } from "url";
import { WebSocketServer, WebSocket } from "ws";

import { verifyAccessToken } from "../utils/jwt";
import { websocketManager } from "./webSocket.manager";

export const initializeWebSocket = (server: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({
    server,
  });

  console.log("WebSocket server initialized");

  wss.on("connection", (socket: WebSocket, request) => {
    try {
      // -----------------------------------------
      // 1. Get token from URL
      // -----------------------------------------

      const url = new URL(request.url ?? "", `http://${request.headers.host}`);

      const token = url.searchParams.get("token");

      if (!token) {
        console.log("WebSocket connection rejected: token missing");

        socket.close(1008, "Authentication required");
        return;
      }

      // -----------------------------------------
      // 2. Verify JWT
      // -----------------------------------------

      const payload = verifyAccessToken(token);

      if (typeof payload !== "object" || payload === null || !("userId" in payload)) {
        console.log("WebSocket connection rejected: invalid token");

        socket.close(1008, "Invalid access token");
        return;
      }

      const userId = payload.userId as string;

      // -----------------------------------------
      // 3. Store user's WebSocket connection
      // -----------------------------------------

      websocketManager.addConnection(userId, socket);

      console.log(`WebSocket connected for user: ${userId}`);

      // -----------------------------------------
      // 4. Confirm successful authentication
      // -----------------------------------------

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "CONNECTION_SUCCESS",
            message: "WebSocket connected successfully",
            userId,
          })
        );
      }

      console.log(`WebSocket authenticated for user: ${userId}`);

      // -----------------------------------------
      // 5. Handle messages received from client
      // -----------------------------------------

      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());

          console.log(`WebSocket message received from user ${userId}:`, data);

          // Echo message back to sender
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "MESSAGE_RECEIVED",
                data,
              })
            );
          }
        } catch (error) {
          console.error("Invalid WebSocket message:", error);

          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "ERROR",
                message: "Invalid WebSocket message",
              })
            );
          }
        }
      });

      // -----------------------------------------
      // 6. Remove connection when disconnected
      // -----------------------------------------

      socket.on("close", () => {
        /*
         * Pass the socket as well.
         *
         * This prevents an old connection from deleting
         * a newer connection belonging to the same user.
         */
        websocketManager.removeConnection(userId, socket);

        console.log(`WebSocket connection closed for user: ${userId}`);
      });

      // -----------------------------------------
      // 7. Handle WebSocket errors
      // -----------------------------------------

      socket.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    } catch (error) {
      // -----------------------------------------
      // Authentication / connection error
      // -----------------------------------------

      console.error("WebSocket authentication failed:", error);

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1008, "Invalid or expired access token");
      }
    }
  });

  return wss;
};
