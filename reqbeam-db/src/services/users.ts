import { PrismaClient } from '@prisma/client';
import { User } from '../types';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user as User | null;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as User | null;
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    name?: string | null;
    password?: string | null;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        password: data.password || null,
      },
    });

    return user as User;
  }

  /**
   * Check if user exists by email
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user !== null;
  }
}

