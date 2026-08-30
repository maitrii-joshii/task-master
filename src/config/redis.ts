import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not configured");
}

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

export default redisClient;
