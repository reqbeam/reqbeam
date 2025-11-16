import { prisma } from '../prisma.js'

export class UserService {
  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    })
  }

  /**
   * Find user by ID (minimal fields for auth)
   */
  async findByIdForAuth(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string
    name?: string | null
    password?: string | null
  }) {
    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        password: data.password || null,
      },
    })
  }

  /**
   * Update user
   */
  async update(id: string, data: {
    name?: string | null
    password?: string | null
  }) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.password !== undefined) updateData.password = data.password

    return await prisma.user.update({
      where: { id },
      data: updateData,
    })
  }
}

