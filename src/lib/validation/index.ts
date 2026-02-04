/**
 * Validation Module
 * 
 * Exports for the task validation system.
 * Network Security Virtual Lab - Educational Platform
 */

export * from './types';
export * from './TaskValidator';

// Default export
export { getTaskValidator, resetTaskValidator } from './TaskValidator';
