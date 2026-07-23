const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const gameEngine = require('../services/GameEngine');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let io, serverSocket, clientSocket;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const httpServer = createServer();
  io = new Server(httpServer);
  
  // Initialize game engine with io
  gameEngine.init(io);

  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = new Client(`http://localhost:${port}`);
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
  });
});

afterAll(async () => {
  io.close();
  clientSocket.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Socket Integration', () => {
  test('should connect and receive events', (done) => {
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });
});
