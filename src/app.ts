import express, { Application, Request, Response } from "express";
import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app: Application = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use the imported routes
app.use("/api/v1", routes);

// Error handling middleware
app.use(errorMiddleware);

// Route to check if the application is running
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "The application is running successfully!" });
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "Healthy", timestamp: new Date().toISOString() });
});

export default app;
