import { 
  users, 
  gameHistory, 
  type User, 
  type InsertUser, 
  type GameHistory, 
  type InsertGameHistory 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getGameHistory(userId: number): Promise<GameHistory[]>;
  addGameHistory(history: InsertGameHistory): Promise<GameHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({ balance: user.balance + amount })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async getGameHistory(userId: number): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId));
  }

  async addGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const [history] = await db
      .insert(gameHistory)
      .values(insertHistory)
      .returning();
    return history;
  }
}

// Create default users for demo purposes if they don't exist
const initializeDefaultUsers = async (storage: DatabaseStorage) => {
  // Create regular player account
  const defaultUser = await storage.getUserByUsername("player123");
  if (!defaultUser) {
    await storage.createUser({
      username: "player123",
      password: "password123", // Player's password
      balance: 5000
    });
    console.log("Created default player account: player123 / password123");
  }
  
  // Create admin account
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    await storage.createUser({
      username: "admin",
      password: "admin123", // Admin password
      balance: 10000
    });
    console.log("Created admin account: admin / admin123");
  } else {
    // Ensure the admin password is correct
    const [updatedAdmin] = await db
      .update(users)
      .set({ password: "admin123" })
      .where(eq(users.username, "admin"))
      .returning();
  }
};

// Use database storage
export const storage = new DatabaseStorage();

// Initialize default users
initializeDefaultUsers(storage).catch(console.error);
