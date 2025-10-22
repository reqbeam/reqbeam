import { Request, ExecutionResult, Environment } from '../types.js';
export declare class RequestExecutor {
    static executeRequest(request: Request, environment?: Environment, verbose?: boolean): Promise<ExecutionResult>;
    private static processRequestWithEnvironment;
    private static replaceVariables;
}
//# sourceMappingURL=request.d.ts.map