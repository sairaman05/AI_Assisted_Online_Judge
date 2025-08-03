import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router.js';
import DBConnection from './database.js';
import cookieParser from "cookie-parser";

dotenv.config();

const port = process.env.PORT;
const app = express();
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());


DBConnection();
app.use("/api", router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
