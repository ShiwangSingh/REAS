require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);


app.use(cors({
  origin: process.env.CLIENT_URL, // uses your env variable
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// your routes below...
app.use('/api/users', userRoutes);

// Environment variables
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8081';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reas';

// Database Connection
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // Give Atlas 10s to respond
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   → Make sure MONGODB_URI in .env points to your Atlas cluster');
    console.error('   → Also check that your IP is whitelisted in Atlas Network Access');
  });

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
const alertsRoutes = require('./routes/alerts');
const usersRoutes  = require('./routes/users');
const statsRoutes  = require('./routes/stats');
const mlRoutes     = require('./routes/ml');

app.use('/api/alerts', alertsRoutes);
app.use('/api/users',  usersRoutes);
app.use('/api/stats',  statsRoutes);
app.use('/api/ml',     mlRoutes);    // AI road analysis proxy → Python :8000

// Setup Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io); // so routes can emit events

const Alert = require('./models/Alert');
const User = require('./models/User');

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running correctly' });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Initial Data
  socket.on('get_initial_data', async () => {
    try {
      const alerts = await Alert.find().sort({ reportedAt: -1 }).limit(50);
      const leaderboard = await User.find().sort({ karmaPoints: -1 }).limit(10);
      socket.emit('initial_data', { alerts, leaderboard });
    } catch (error) {
      console.error('Socket initial data error:', error);
    }
  });

  // Example Event
  socket.on('message', (dataMsg) => {
    console.log(`Message from client:`, dataMsg);
    // Broadcast back to all clients
    io.emit('message', { sender: socket.id, content: dataMsg });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
