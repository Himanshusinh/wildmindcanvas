
import { AbstractIntent, ResolvedAction } from './intentSchemas';
import { compileGoalToPlan } from './compiler/instructionCompiler';

/**
 * Capability Resolver (Layer 3)
 * Simply routes the Semantic Intent to the Instruction Compiler.
 */
export function resolveIntent(intent: AbstractIntent, _context: any): ResolvedAction {
    // 1. Handle Clarification / Direct Responses
    if (intent.goalType === 'CLARIFY' || intent.goalType === 'EXPLAIN_CANVAS') {
        return {
            intent: 'ANSWER',
            capability: 'TEXT',
            modelId: 'standard',
            payload: {},
            requiresConfirmation: false,
            explanation: intent.explanation
        };
    }

    // 2. Compile Semantic Intent into deterministic CanvasInstructionPlan
    const plan = compileGoalToPlan(intent);

    // 3. Wrap in a ResolvedAction for the Execution Engine
    return {
        intent: 'EXECUTE_PLAN',
        capability: 'UNKNOWN', // The plan contains mixed capabilities
        modelId: 'compiler',
        payload: plan, // The plan IS the payload
        requiresConfirmation: plan.requiresConfirmation,
        explanation: intent.explanation
    };
}
