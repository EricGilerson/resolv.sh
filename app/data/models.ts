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
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        description: 'Hybrid reasoning model capable of instant responses or extended thinking. Top-tier for complex coding and agentic tasks.',
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
        id: 'openai/gpt-5',
        name: 'GPT-5',
        provider: 'OpenAI',
        contextWindow: 128000,
        description: 'Next-generation flagship model with massive improvements in reliability, reasoning, and multi-step tool execution.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 1.25,
            output: 10.00,
        },
    },
    {
        id: 'google/gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        provider: 'Google',
        contextWindow: 2000000,
        description: 'Massive 2M context window with enhanced multimodal understanding and native grounding for complex research tools.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 2.00,
            output: 12.00,
        },
    },
    {
        id: 'x-ai/grok-4.1-fast',
        name: 'Grok 4.1 Fast',
        provider: 'xAI',
        contextWindow: 256000,
        description: 'High-speed reasoning model optimized for real-time data analysis and parallel tool calling.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 5.00,
            output: 25.00,
        },
    },
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        description: 'Reliable industry standard for high-accuracy coding and tool-integrated workflows.',
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
        id: 'openai/o1',
        name: 'OpenAI o1',
        provider: 'OpenAI',
        contextWindow: 128000,
        description: 'Specialized reasoning model that uses chain-of-thought to solve highly complex mathematical and logical problems.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 15.00,
            output: 60.00,
        },
    },
    {
        id: 'google/gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        contextWindow: 2000000,
        description: 'Pro-tier model with deep reasoning and extensive context, ideal for analyzing entire codebases.',
        capabilities: {
            vision: true,
            coding: true,
            functionCalling: true,
        },
        pricing: {
            input: 1.25,
            output: 3.75,
        },
    },
    {
        id: 'x-ai/grok-3',
        name: 'Grok 3',
        provider: 'xAI',
        contextWindow: 131072,
        description: 'Flagship model from xAI with strong reasoning traces and deep domain knowledge in science and finance.',
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
        description: 'Omni model balanced for speed and performance across vision, audio, and text modalities.',
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
];

export const OPEN_SOURCE_MODELS: Model[] = [
    {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        provider: 'Google',
        contextWindow: 1048576,
        description: 'High-speed multimodal model with a 1M context window and exceptionally low latency for tool calls.',
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
        id: 'google/gemma-3-27b-it:free',
        name: 'Gemma 3 (Free)',
        provider: 'Google',
        contextWindow: 128000,
        description: 'Optimized for agentic workflows with native multimodal support and strong JSON adherence.',
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
        description: 'State-of-the-art open-weight model with robust reasoning and precise tool calling reliability.',
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
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'DeepSeek R1 (Free)',
        provider: 'DeepSeek',
        contextWindow: 163840,
        description: 'Powerful reasoning model using reinforcement learning to solve complex logic tasks via tool use.',
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
        description: 'Highly efficient model specifically optimized for low-latency function calling and structured outputs.',
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
