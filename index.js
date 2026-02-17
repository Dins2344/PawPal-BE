const express = require('express');
const app = express();
const userRouter = require('./src/routes/user');
const connectToDatabase = require('./src/db/connection');

app.use('/users', userRouter);






connectToDatabase();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});