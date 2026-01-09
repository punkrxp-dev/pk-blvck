import { type User, type InsertUser, type LoginUser } from '@shared/schema';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { users } });

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(credentials: LoginUser): Promise<User | null>;
  updateUserPassword(id: string, newPassword: string): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  private saltRounds = 12;

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Database error');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw new Error('Database error');
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(insertUser.password, this.saltRounds);

      const result = await db
        .insert(users)
        .values({
          username: insertUser.username,
          password: hashedPassword,
        })
        .returning();

      if (!result[0]) {
        throw new Error('Failed to create user');
      }

      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Username already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(credentials.username);
      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      return isValidPassword ? user : null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  async updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      const result = await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false;
    }
  }
}

export const storage = new PostgresStorage();
