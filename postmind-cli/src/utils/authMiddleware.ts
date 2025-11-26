import { AuthManager } from './auth.js';
import chalk from 'chalk';

/**
 * Authentication middleware wrapper for CLI commands
 * This ensures commands require authentication before execution
 */
export function requireAuth(commandName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const authManager = AuthManager.getInstance();
      
      try {
        // Check if authentication is required for this command
        await authManager.checkAuthRequired(commandName);
        
        // If we get here, authentication passed - execute the original method
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        // Authentication failed - error already handled by AuthManager
        return;
      }
    };

    return descriptor;
  };
}

/**
 * Execute a function with authentication check
 */
export async function withAuth<T>(
  commandName: string,
  fn: () => Promise<T>
): Promise<T> {
  const authManager = AuthManager.getInstance();
  
  try {
    await authManager.checkAuthRequired(commandName);
    return await fn();
  } catch (error: any) {
    // Authentication failed - error already handled by AuthManager
    throw error;
  }
}

/**
 * Check authentication at the start of command execution
 */
export async function checkAuthentication(commandName: string): Promise<void> {
  const authManager = AuthManager.getInstance();
  await authManager.checkAuthRequired(commandName);
}

