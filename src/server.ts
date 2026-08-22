import dotenv from "dotenv";
dotenv.config();
import app from "./app";

const PORT = Number.parseInt(process.env.PORT ?? "6000", 10);

if (Number.isNaN(PORT)) throw new Error("PORT must be a number");

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
