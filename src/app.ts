import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Route to check if the application is running
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'The application is running successfully!' });
});


export default app;