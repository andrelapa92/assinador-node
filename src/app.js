import express from 'express';
import cors from 'cors';
import userRouter from './routes/userRouter.js';
import restaurantRouter from './routes/restaurantRouter.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/v1/user/', userRouter);
app.use('/api/v1/restaurant/', restaurantRouter);
app.use((err, req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(err.status || 500);
    console.log(`${err.status} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    res.json({ error: err.message });
    next();
});

export default app;