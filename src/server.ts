import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import prisma from "./config/prisma";

const PORT = Number.parseInt(process.env.PORT ?? "6000", 10);

if (Number.isNaN(PORT)) throw new Error("PORT must be a number");

// Start the server and connect to the database
const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
