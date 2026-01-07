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
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        contextWindow: 128000,
        description: 'Flagship high-intelligence model for complex, multi-step tasks. Multimodal by default.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 5.00,
            output: 15.00,
        },
    },
    {
        id: 'claude-3-5-sonnet-latest',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        description: 'Most intelligent model to date, excelling at coding, nuance, and complex reasoning.',
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
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        contextWindow: 2000000,
        description: 'Mid-size multimodal model optimized for scaling across a wide range of tasks with a massive context window.',
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
        id: 'llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B',
        provider: 'Meta',
        contextWindow: 128000,
        description: 'The first frontier-level open source model. Unrivaled capability among open weights.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
    },
    {
        id: 'mixtral-8x22b-instruct',
        name: 'Mixtral 8x22B',
        provider: 'Mistral AI',
        contextWindow: 64000,
        description: 'A powerful sparse mixture-of-experts model with strong reasoning, math, and coding capabilities.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
    },
    {
        id: 'deepseek-coder-v2',
        name: 'DeepSeek Coder V2',
        provider: 'DeepSeek',
        contextWindow: 128000,
        description: 'Specialized model for code generation and analysis, outperforming many closed models on benchmarks.',
        capabilities: {
            vision: false,
            coding: true,
            functionCalling: true,
        },
    },
];
