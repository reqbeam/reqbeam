import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ProjectConfig, Project } from '../types.js';

export class StorageManager {
  private static instance: StorageManager;
  private readonly baseDir: string;

  private constructor() {
    this.baseDir = path.join(os.homedir(), '.reqbeam');
    this.ensureBaseDir();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private async ensureBaseDir(): Promise<void> {
    await fs.ensureDir(this.baseDir);
  }

  public getProjectsDir(): string {
    return path.join(this.baseDir, 'projects');
  }

  public getProjectPath(projectName: string): string {
    return path.join(this.getProjectsDir(), projectName);
  }

  public async listProjects(): Promise<Project[]> {
    const projectsDir = this.getProjectsDir();
    await fs.ensureDir(projectsDir);
    
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const projects: Project[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(projectsDir, entry.name);
        const configPath = path.join(projectPath, 'config.json');
        
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJson(configPath);
          projects.push({
            name: entry.name,
            path: projectPath,
            createdAt: config.createdAt || new Date().toISOString(),
            updatedAt: config.updatedAt || new Date().toISOString()
          });
        }
      }
    }

    return projects;
  }

  public async createProject(projectName: string): Promise<void> {
    const projectPath = this.getProjectPath(projectName);
    await fs.ensureDir(projectPath);
    await fs.ensureDir(path.join(projectPath, 'requests'));
    await fs.ensureDir(path.join(projectPath, 'collections'));
    await fs.ensureDir(path.join(projectPath, 'environments'));

    const config: ProjectConfig = {
      name: projectName,
      environments: [],
      requests: [],
      collections: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.saveProjectConfig(projectName, config);
  }

  public async deleteProject(projectName: string): Promise<void> {
    const projectPath = this.getProjectPath(projectName);
    if (await fs.pathExists(projectPath)) {
      await fs.remove(projectPath);
    }
  }

  public async loadProjectConfig(projectName: string): Promise<ProjectConfig> {
    const configPath = path.join(this.getProjectPath(projectName), 'config.json');
    
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Project '${projectName}' not found`);
    }

    return await fs.readJson(configPath);
  }

  public async saveProjectConfig(projectName: string, config: ProjectConfig): Promise<void> {
    const projectPath = this.getProjectPath(projectName);
    await fs.ensureDir(projectPath);
    
    config.updatedAt = new Date().toISOString();
    await fs.writeJson(path.join(projectPath, 'config.json'), config, { spaces: 2 });
  }

  public async getCurrentProject(): Promise<string | null> {
    const currentProjectPath = path.join(this.baseDir, 'current-project');
    
    if (await fs.pathExists(currentProjectPath)) {
      return await fs.readFile(currentProjectPath, 'utf-8');
    }
    
    return null;
  }

  public async setCurrentProject(projectName: string): Promise<void> {
    const currentProjectPath = path.join(this.baseDir, 'current-project');
    await fs.writeFile(currentProjectPath, projectName);
  }

  public async getCurrentEnvironment(projectName: string): Promise<string | null> {
    const config = await this.loadProjectConfig(projectName);
    return config.currentEnvironment || null;
  }

  public async setCurrentEnvironment(projectName: string, environmentName: string): Promise<void> {
    const config = await this.loadProjectConfig(projectName);
    config.currentEnvironment = environmentName;
    await this.saveProjectConfig(projectName, config);
  }
}
