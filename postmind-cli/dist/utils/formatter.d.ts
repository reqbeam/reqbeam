import { ExecutionResult, Project, Environment, Request, Collection, HistoryEntry } from '../types.js';
export declare class Formatter {
    static formatExecutionResult(result: ExecutionResult): string;
    static formatExecutionResults(results: ExecutionResult[]): string;
    static formatProjects(projects: Project[]): string;
    static formatEnvironments(environments: Environment[]): string;
    static formatRequests(requests: Request[]): string;
    static formatCollections(collections: Collection[]): string;
    static formatHistory(history: HistoryEntry[]): string;
    static formatSummary(results: ExecutionResult[]): string;
    private static getMethodColor;
    private static getStatusColor;
}
//# sourceMappingURL=formatter.d.ts.map