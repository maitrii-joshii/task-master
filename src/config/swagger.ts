import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Master API",
      version: "1.0.0",
      description: "REST API for the Task Master collaborative task tracking system",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
