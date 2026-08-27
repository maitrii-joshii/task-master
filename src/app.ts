import express, { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middleware/error.middleware";

const app: Application = express();

// Parse JSON bodies
app.use(express.json());

// API routes
app.use("/api/v1", routes);

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application status route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "The application is running successfully!",
  });
});

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "Healthy",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
