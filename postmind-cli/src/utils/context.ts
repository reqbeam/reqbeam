import fs from 'fs-extra'
import os from 'os'
import path from 'path'

export interface CliContext {
  activeWorkspace?: {
    id: string
    name: string
  }
  activeCollection?: {
    id: string
    name: string
  }
}

export class ContextManager {
  private static instance: ContextManager
  private contextPath: string

  private constructor() {
    const dir = path.join(os.homedir(), '.postmind')
    this.contextPath = path.join(dir, 'context.json')
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  private async loadContext(): Promise<CliContext> {
    try {
      if (await fs.pathExists(this.contextPath)) {
        return (await fs.readJson(this.contextPath)) as CliContext
      }
    } catch {
      // ignore
    }
    return {}
  }

  private async saveContext(ctx: CliContext): Promise<void> {
    const dir = path.dirname(this.contextPath)
    await fs.ensureDir(dir)
    await fs.writeJson(this.contextPath, ctx, { spaces: 2 })
  }

  public async getActiveWorkspace(): Promise<CliContext['activeWorkspace']> {
    const ctx = await this.loadContext()
    return ctx.activeWorkspace
  }

  public async setActiveWorkspace(workspace: { id: string; name: string }): Promise<void> {
    const ctx = await this.loadContext()
    ctx.activeWorkspace = { id: workspace.id, name: workspace.name }
    // clear selected collection if switching workspace
    ctx.activeCollection = undefined
    await this.saveContext(ctx)
  }

  public async clearActiveWorkspace(): Promise<void> {
    const ctx = await this.loadContext()
    ctx.activeWorkspace = undefined
    ctx.activeCollection = undefined
    await this.saveContext(ctx)
  }

  public async getActiveCollection(): Promise<CliContext['activeCollection']> {
    const ctx = await this.loadContext()
    return ctx.activeCollection
  }

  public async setActiveCollection(collection: { id: string; name: string }): Promise<void> {
    const ctx = await this.loadContext()
    ctx.activeCollection = { id: collection.id, name: collection.name }
    await this.saveContext(ctx)
  }

  public async clearActiveCollection(): Promise<void> {
    const ctx = await this.loadContext()
    ctx.activeCollection = undefined
    await this.saveContext(ctx)
  }
}


