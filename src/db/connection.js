const mongoose = require('mongoose');

const mongoUrl = "mongodb+srv://dinsoncd:RNAGkZYoDTce9UFj@cluster0.a4lblch.mongodb.net/?appName=Cluster0"



async function connectToDatabase() {
    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}


module.exports = connectToDatabase;