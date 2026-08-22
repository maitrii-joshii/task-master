import dotenv from 'dotenv';
dotenv.config();
import app from './app';

const PORT = process.env.PORT || 6000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});