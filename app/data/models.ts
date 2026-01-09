export interface Model {
    id: string; // The backend identifier (e.g., "gpt-4o")
    name: string; // Display name
    provider: string;
    contextWindow: number;
    description: string;
    capabilities: {
        vision: boolean;
        coding: boolean;
        functionCalling: boolean;
    };
    pricing?: {
        input: number;
        output: number;
    };
    // Future internal fields (e.g., distinct API keys or upstream endpoints) can be added here
    // and filtered out in the API route.
}

export interface ModelsResponse {
    premier: Model[];
    openSource: Model[];
}

export const PREMIER_MODELS: Model[] = [
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        description: 'Top-tier reasoning and coding capabilities. Ideal for complex architectural tasks.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 3.00,
            output: 15.00,
        },
    },
    {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        contextWindow: 128000,
        description: 'The flagship "omni" model. Extremely fast and versatile with strong multimodal performance.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 2.50,
            output: 10.00,
        },
    },
    {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        contextWindow: 2000000,
        description: 'Massive context window (2M tokens) for processing entire repositories or large documentation sets.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 3.50,
            output: 10.50,
        },
    },
];

export const OPEN_SOURCE_MODELS: Model[] = [
    {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        provider: 'Google',
        contextWindow: 1048576,
        description: 'Experimental high-speed model with a massive 1M token context window. Great for quick queries.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 0,
            output: 0,
        },
    },
    {
        id: 'google/gemini-2.0-flash-thinking-exp:free',
        name: 'Gemini 2.0 Flash Thinking (Free)',
        provider: 'Google',
        contextWindow: 1048576,
        description: 'Thinking model with enhanced reasoning capabilities, ideal for complex problem solving.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 0,
            output: 0,
        },
    },
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B (Free)',
        provider: 'Meta',
        contextWindow: 128000,
        description: 'Highly capable open-weight model with strong reasoning, rivaling proprietary options.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 0,
            output: 0,
        },
    },
    {
        id: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek R1 (Free)',
        provider: 'DeepSeek',
        contextWindow: 64000,
        description: 'Optimized for reasoning and coding tasks. A strong alternative to larger proprietary models.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 0,
            output: 0,
        },
    },
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3 (Free)',
        provider: 'Mistral',
        contextWindow: 32000,
        description: 'Efficient and capable model from Mistral, balancing performance and speed.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 0,
            output: 0,
        },
    },
];

export function getModelById(modelId: string): Model | undefined {
    return [...PREMIER_MODELS, ...OPEN_SOURCE_MODELS].find(m => m.id === modelId);
}
