import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { hasSufficientBalance, calculateBaseCostFromTokens, recordChatUsageAsync } from '@/app/lib/billing';
import { EXPERT_PROMPTS, GENERAL_AGENT_PROMPT, ASK_MODE_PROMPT } from '@/app/lib/prompts';
import { getModelById } from '@/app/data/models';

export const runtime = 'edge';

const MODE_PROMPTS: any = {
    expert: EXPERT_PROMPTS,
    general_agent: GENERAL_AGENT_PROMPT,
    ask: ASK_MODE_PROMPT,
};

export async function POST(req: NextRequest) {
    // 1. Validate auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const token = authHeader.slice(7);

    // Verify JWT and get user ID
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const userId = user.id;

    // 2. Check Balance
    const canProceed = await hasSufficientBalance(userId);
    if (!canProceed) {
        // Return 402 Payment Required or just a friendly error event?
        // Let's return strict error for now.
        return new Response(JSON.stringify({ error: 'Insufficient funds. Please top up.' }), {
            status: 402,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 3. Parse Request
    const body = await req.json();
    const { mode, modelId, message, context, expertStep } = body;

    // Validate Model
    const model = getModelById(modelId);
    if (!model) {
        return new Response(JSON.stringify({ error: 'Invalid model ID' }), {
            status: 400,
        });
    }

    // 4. Build System Prompt
    let systemPrompt: string;
    if (mode === 'expert') {
        // @ts-ignore
        systemPrompt = MODE_PROMPTS.expert[`${expertStep?.toUpperCase()}_PROMPT`] || MODE_PROMPTS.expert.SUPERVISOR_PROMPT;

        // Mapping might need adjustment based on how index exports them.
        // The index exports: SUPERVISOR_PROMPT, PLANNER_PROMPT etc.
        // Let's fix the mapping logic.
        if (expertStep === 'supervisor') systemPrompt = EXPERT_PROMPTS.SUPERVISOR_PROMPT;
        else if (expertStep === 'planner') systemPrompt = EXPERT_PROMPTS.PLANNER_PROMPT;
        else if (expertStep === 'executor') systemPrompt = EXPERT_PROMPTS.EXECUTOR_PROMPT;
        else if (expertStep === 'auditor') systemPrompt = EXPERT_PROMPTS.AUDITOR_PROMPT;
        else systemPrompt = EXPERT_PROMPTS.SUPERVISOR_PROMPT;

    } else {
        systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.general_agent;
    }

    const fullSystemPrompt = `${systemPrompt}

## Context Files
### todo.md
${context?.todo || '(empty)'}

### notes.txt
${context?.notes || '(empty)'}

### continuity.txt
${context?.continuity || '(empty)'}

### diff.txt
${context?.diff || '(empty)'}

### project.txt
${context?.project || '(empty)'}
`;

    // 5. Forward to OpenRouter
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://resolv.dev',
            'X-Title': 'Resolv IDE',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: fullSystemPrompt },
                { role: 'user', content: message },
            ],
            stream: true,
            include_reasoning: true
        }),
    });

    if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        console.error('OpenRouter Error:', errorText);
        return new Response(`event: error\ndata: ${JSON.stringify({ message: `OpenRouter Error: ${openrouterResponse.statusText}` })}\n\n`, {
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }

    // 6. Transform Stream & Track Usage
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const reader = openrouterResponse.body!.getReader();
            let buffer = '';
            let promptTokens = 0;
            let completionTokens = 0;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const json = JSON.parse(line.slice(6));

                                // 1. Extract Usage if present (OpenRouter sends this in final chunk usually)
                                if (json.usage) {
                                    promptTokens = json.usage.prompt_tokens || 0;
                                    completionTokens = json.usage.completion_tokens || 0;
                                }

                                // 2. Extract Delta
                                const delta = json.choices?.[0]?.delta?.content;
                                if (delta) {
                                    controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ delta })}\n\n`));
                                }

                                // 3. Handle Reasoning (Optional, if model supports it)
                                const reasoning = json.choices?.[0]?.delta?.reasoning;
                                if (reasoning) {
                                    // Maybe emit as a different event or just content?
                                    // For now, let's treat as content or ignore.
                                }

                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Stream processing error:', err);
                controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Stream interrupted' })}\n\n`));
            } finally {
                // Done event
                controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
                controller.close();

                // 7. Async Billing
                if (promptTokens > 0 || completionTokens > 0) {
                    const baseCost = calculateBaseCostFromTokens(modelId, promptTokens, completionTokens);
                    console.log(`[Billing] User ${userId}: ${modelId} | ${promptTokens}in/${completionTokens}out | $${baseCost}`);

                    // Fire and forget
                    recordChatUsageAsync(userId, modelId, baseCost);
                } else {
                    console.warn('[Billing] No usage stats found in stream for user', userId);
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
