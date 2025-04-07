import { 
  users, 
  gameHistory, 
  type User, 
  type InsertUser, 
  type GameHistory, 
  type InsertGameHistory 
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getGameHistory(userId: number): Promise<GameHistory[]>;
  addGameHistory(history: InsertGameHistory): Promise<GameHistory>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private history: Map<number, GameHistory>;
  private currentUserId: number;
  private currentHistoryId: number;

  constructor() {
    this.users = new Map();
    this.history = new Map();
    this.currentUserId = 1;
    this.currentHistoryId = 1;
    
    // Create a default user for demo purposes
    this.createUser({
      username: "player123",
      password: "password123",
      balance: 5000
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      balance: user.balance + amount
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getGameHistory(userId: number): Promise<GameHistory[]> {
    return Array.from(this.history.values()).filter(
      (history) => history.userId === userId,
    );
  }

  async addGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const id = this.currentHistoryId++;
    const history: GameHistory = { ...insertHistory, id };
    this.history.set(id, history);
    return history;
  }
}

export const storage = new MemStorage();
