import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import prisma from "./config/prisma";
import redisClient from "./config/redis";
import { initializeWebSocket } from "./webSocket/webSocket.handler";

const PORT = Number.parseInt(process.env.PORT ?? "6000", 10);

if (Number.isNaN(PORT)) {
  throw new Error("PORT must be a number");
}

// Create HTTP server using the Express application
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Start the server and connect to infrastructure
const startServer = async (): Promise<void> => {
  try {
    // Connect to PostgreSQL
    await prisma.$connect();

    console.log("Database connected successfully");
    // Connect to Redis
    await redisClient.connect();

    console.log("Redis connected successfully");
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
