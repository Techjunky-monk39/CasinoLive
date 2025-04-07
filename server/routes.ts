import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGameHistorySchema, GameType } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { WebSocketServer, WebSocket } from 'ws';
import { log } from "./vite";

// Extend express session type for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session management
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "casino-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      // For the simple plain text password comparison for now
      // In a real application, we would use bcrypt.compare or similar
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        balance: user.balance,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        balance: user.balance,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(200).json(null);
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(200).json(null);
    }
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      balance: user.balance,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Game routes
  app.post("/api/games/update-balance", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (typeof amount !== "number") {
        return res.status(400).json({ message: "Amount must be a number" });
      }
      
      const userId = req.session.userId as number;
      const user = await storage.updateUserBalance(userId, amount);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        balance: user.balance,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/games/history", requireAuth, async (req, res) => {
    try {
      const historyData = {
        ...req.body,
        userId: req.session.userId as number,
        timestamp: new Date().toISOString(),
      };
      
      const validatedData = insertGameHistorySchema.parse(historyData);
      const history = await storage.addGameHistory(validatedData);
      
      return res.status(201).json(history);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/games/history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const history = await storage.getGameHistory(userId);
      return res.status(200).json(history);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for live chat and multiplayer functionality
  // WebSocket connections and game rooms
  interface WsClient extends WebSocket {
    userId?: number;
    username?: string;
    gameId?: string;
    isAlive?: boolean;
  }

  interface GameRoom {
    id: string;
    clients: WsClient[];
    gameType: GameType;
  }

  const gameRooms = new Map<string, GameRoom>();
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WsClient) => {
    log('WebSocket client connected');
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'join':
            handleJoinRoom(ws, data);
            break;
          case 'chat':
            handleChatMessage(ws, data);
            break;
          case 'game':
            handleGameAction(ws, data);
            break;
          default:
            log(`Unknown message type: ${data.type}`);
        }
      } catch (err) {
        log(`Error processing WebSocket message: ${err}`);
      }
    });
    
    ws.on('close', () => {
      handleDisconnect(ws);
      log('WebSocket client disconnected');
    });
  });
  
  // Heartbeat to keep connections alive and detect disconnects
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WsClient) => {
      if (ws.isAlive === false) {
        handleDisconnect(ws);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // WebSocket handler functions
  function handleJoinRoom(ws: WsClient, data: any) {
    const { gameId, username } = data;
    
    if (!gameId || !username) {
      return sendError(ws, 'Game ID and username are required');
    }
    
    // Set client properties
    ws.username = username;
    ws.gameId = gameId;
    
    // Create the game room if it doesn't exist
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, {
        id: gameId,
        clients: [],
        gameType: data.gameType || GameType.DICE_456
      });
    }
    
    // Add client to the room
    const room = gameRooms.get(gameId);
    if (room) {
      room.clients.push(ws);
      
      // Broadcast to room that a new player joined
      broadcastToRoom(gameId, {
        type: 'system',
        message: `${username} has joined the game`,
      });
      
      log(`User ${username} joined room ${gameId}`);
    }
  }
  
  function handleChatMessage(ws: WsClient, data: any) {
    const { gameId, username, message } = data;
    
    if (!gameId || !username || !message) {
      return sendError(ws, 'Invalid chat message format');
    }
    
    broadcastToRoom(gameId, {
      type: 'chat',
      username,
      message,
      timestamp: new Date()
    });
    
    log(`Chat message in room ${gameId} from ${username}: ${message}`);
  }
  
  function handleGameAction(ws: WsClient, data: any) {
    const { gameId, action, gameState } = data;
    
    if (!gameId || !action) {
      return sendError(ws, 'Invalid game action format');
    }
    
    // Broadcast the game action to all players in the room
    broadcastToRoom(gameId, {
      type: 'game',
      action,
      gameState,
      username: ws.username
    });
    
    log(`Game action in room ${gameId} from ${ws.username}: ${action}`);
  }
  
  function handleDisconnect(ws: WsClient) {
    if (ws.gameId && ws.username) {
      const room = gameRooms.get(ws.gameId);
      
      if (room) {
        // Remove the client from the room
        room.clients = room.clients.filter(client => client !== ws);
        
        // If room is empty, remove it
        if (room.clients.length === 0) {
          gameRooms.delete(ws.gameId);
          log(`Room ${ws.gameId} removed as it's empty`);
        } else {
          // Notify others that the player left
          broadcastToRoom(ws.gameId, {
            type: 'system',
            message: `${ws.username} has left the game`,
          });
          
          log(`User ${ws.username} left room ${ws.gameId}`);
        }
      }
    }
  }
  
  function sendError(ws: WsClient, errorMessage: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        message: errorMessage
      }));
    }
  }
  
  function broadcastToRoom(roomId: string, message: any) {
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
  
  return httpServer;
}
