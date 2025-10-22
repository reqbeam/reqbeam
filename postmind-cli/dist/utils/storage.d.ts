import { ProjectConfig, Project } from '../types.js';
export declare class StorageManager {
    private static instance;
    private readonly baseDir;
    private constructor();
    static getInstance(): StorageManager;
    private ensureBaseDir;
    getProjectsDir(): string;
    getProjectPath(projectName: string): string;
    listProjects(): Promise<Project[]>;
    createProject(projectName: string): Promise<void>;
    deleteProject(projectName: string): Promise<void>;
    loadProjectConfig(projectName: string): Promise<ProjectConfig>;
    saveProjectConfig(projectName: string, config: ProjectConfig): Promise<void>;
    getCurrentProject(): Promise<string | null>;
    setCurrentProject(projectName: string): Promise<void>;
    getCurrentEnvironment(projectName: string): Promise<string | null>;
    setCurrentEnvironment(projectName: string, environmentName: string): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map