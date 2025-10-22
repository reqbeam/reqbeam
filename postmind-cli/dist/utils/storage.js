import fs from 'fs-extra';
import path from 'path';
import os from 'os';
export class StorageManager {
    static instance;
    baseDir;
    constructor() {
        this.baseDir = path.join(os.homedir(), '.postmind');
        this.ensureBaseDir();
    }
    static getInstance() {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }
    async ensureBaseDir() {
        await fs.ensureDir(this.baseDir);
    }
    getProjectsDir() {
        return path.join(this.baseDir, 'projects');
    }
    getProjectPath(projectName) {
        return path.join(this.getProjectsDir(), projectName);
    }
    async listProjects() {
        const projectsDir = this.getProjectsDir();
        await fs.ensureDir(projectsDir);
        const entries = await fs.readdir(projectsDir, { withFileTypes: true });
        const projects = [];
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
    async createProject(projectName) {
        const projectPath = this.getProjectPath(projectName);
        await fs.ensureDir(projectPath);
        await fs.ensureDir(path.join(projectPath, 'requests'));
        await fs.ensureDir(path.join(projectPath, 'collections'));
        await fs.ensureDir(path.join(projectPath, 'environments'));
        const config = {
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
    async deleteProject(projectName) {
        const projectPath = this.getProjectPath(projectName);
        if (await fs.pathExists(projectPath)) {
            await fs.remove(projectPath);
        }
    }
    async loadProjectConfig(projectName) {
        const configPath = path.join(this.getProjectPath(projectName), 'config.json');
        if (!(await fs.pathExists(configPath))) {
            throw new Error(`Project '${projectName}' not found`);
        }
        return await fs.readJson(configPath);
    }
    async saveProjectConfig(projectName, config) {
        const projectPath = this.getProjectPath(projectName);
        await fs.ensureDir(projectPath);
        config.updatedAt = new Date().toISOString();
        await fs.writeJson(path.join(projectPath, 'config.json'), config, { spaces: 2 });
    }
    async getCurrentProject() {
        const currentProjectPath = path.join(this.baseDir, 'current-project');
        if (await fs.pathExists(currentProjectPath)) {
            return await fs.readFile(currentProjectPath, 'utf-8');
        }
        return null;
    }
    async setCurrentProject(projectName) {
        const currentProjectPath = path.join(this.baseDir, 'current-project');
        await fs.writeFile(currentProjectPath, projectName);
    }
    async getCurrentEnvironment(projectName) {
        const config = await this.loadProjectConfig(projectName);
        return config.currentEnvironment || null;
    }
    async setCurrentEnvironment(projectName, environmentName) {
        const config = await this.loadProjectConfig(projectName);
        config.currentEnvironment = environmentName;
        await this.saveProjectConfig(projectName, config);
    }
}
//# sourceMappingURL=storage.js.map