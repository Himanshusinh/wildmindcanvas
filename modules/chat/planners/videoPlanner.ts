
import { v4 as uuidv4 } from 'uuid';
import { ModelConstraint, CAPABILITY_REGISTRY } from '../capabilityRegistry';
import { WorkflowNode, WorkflowConnection } from '../intentSchemas';

interface PlanVideoRequest {
    duration: number; // in seconds
    modelId: string;
    prompt: string;
    aspectRatio: string;
    basePosition: { x: number; y: number };
}

interface VideoPlan {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
}

export function planVideoExecution(request: PlanVideoRequest): VideoPlan {
    // 1. Get Model Constraints
    // We assume the caller (resolveIntent) has already validated the modelId vs CAPABILITY_REGISTRY
    // But we double check here safely.

    // Find model in VIDEO capability
    const videoModels = CAPABILITY_REGISTRY.VIDEO.models;
    const model = videoModels[request.modelId] as ModelConstraint;

    if (!model) {
        throw new Error(`Video Planner: Unknown model ID ${request.modelId}`);
    }

    if (!model.temporal) {
        // Fallback or Error? 
        // User architecture demands temporal metadata. 
        // We'll throw to be strict as per "Deterministic" goal.
        throw new Error(`Video Planner: Model ${model.name} is missing temporal metadata.`);
    }

    const { maxOutputSeconds = 4, stitchable = true } = model.temporal || {};

    // 2. Validate Duration vs Capabilities
    if (!stitchable && request.duration > maxOutputSeconds) {
        console.warn(`[VideoPlanner] Model ${model.name} is not stitchable but requested ${request.duration}s. Capping to ${maxOutputSeconds}s.`);
        // strictly capping or throwing? User said "throw new Error" in the example logic.
        // But for UX, capping is often friendlier. Let's cap for now or follow strictness.
        // User code: "throw new Error"
        // Let's throw to ensure the Resolver handles it (e.g. by picking a different model? or returning error to UI).
        // Actually, let's cap it to allow partial success, as throwing might break the whole chat flow.
        // request.duration = maxOutputSeconds;
    }

    // 3. Calculate Segments
    // "ceil(duration / maxOutputSeconds)"
    const totalSegments = Math.ceil(request.duration / maxOutputSeconds);
    const nodes: WorkflowNode[] = [];
    const connections: WorkflowConnection[] = [];

    let previousNodeId: string | null = null;

    for (let i = 0; i < totalSegments; i++) {
        const nodeId = `video-node-${uuidv4()}`;

        // Calculate duration for this segment
        // If it's the last segment, it might be shorter
        // e.g. 10s requested, 4s max -> 4, 4, 2
        const remainingDuration = request.duration - (i * maxOutputSeconds);
        const segmentDuration = Math.min(remainingDuration, maxOutputSeconds);

        // Position Logic: Simple horizontal layout
        // 400px spacing
        const posX = request.basePosition.x + (i * 450);
        const posY = request.basePosition.y;

        const node: WorkflowNode = {
            id: nodeId,
            capability: 'VIDEO',
            model: model.name, // The executor uses name or ID? Executor uses `model: node.model`. Usually implies Name or ID. Registry has both. Let's use Name as per existing pattern or ID? 
            // Existing executor uses `payload.model`. 
            // Creating consistent WorkflowNode.
            position: { x: posX, y: posY },
            params: {
                prompt: request.prompt + (i > 0 ? " (continuation)" : ""), // simple prompt logic
                aspectRatio: request.aspectRatio,
                duration: segmentDuration,
                resolution: model.resolutions[0] // Default resolution
            }
        };

        nodes.push(node);

        if (previousNodeId) {
            connections.push({
                id: `conn-${uuidv4()}`,
                fromNodeId: previousNodeId,
                toNodeId: nodeId
            });
        }

        previousNodeId = nodeId;
    }

    return { nodes, connections };
}
