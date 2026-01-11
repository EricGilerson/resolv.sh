import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { hasSufficientBalance, calculateBaseCostFromTokens, recordChatUsageAsync } from '@/app/lib/billing';
import { EXPERT_PROMPTS, GENERAL_AGENT_PROMPT, ASK_MODE_PROMPT } from '@/app/lib/prompts';
import { ASK_MODE_TOOLS } from '@/app/lib/tools/ask-tools';
import { getModelById } from '@/app/data/models';

// export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const MODE_PROMPTS: any = {
	expert: EXPERT_PROMPTS,
	general_agent: GENERAL_AGENT_PROMPT,
	ask: ASK_MODE_PROMPT,
};

const MODE_TOOLS: any = {
	ask: ASK_MODE_TOOLS,
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
	// 3. Parse Request
	const body = await req.json();
	const { mode, modelId, message, messages, context, expertStep, include_reasoning, session_id } = body;

	// Support both single message (legacy) and messages array (new)
	const conversationMessages = messages || (message ? [{ role: 'user', content: message }] : []);

	// Determine if this is a "Turn Start" (New User Prompt) vs "Continuation" (Thinking/Tools)
	// If history has NO assistant messages, it's a new turn.
	// (Resetting history means a new turn starts with just [User] or [System, User])
	const hasAssistantMessages = conversationMessages.some((m: any) => m.role === 'assistant');
	const isTurnStart = !hasAssistantMessages;

	console.log(`[Billing] Session: ${session_id} | Is Turn Start: ${isTurnStart} | Msg Count: ${conversationMessages.length}`);

	// Validate Model
	const model = getModelById(modelId);
	if (!model) {
		return new Response(JSON.stringify({ error: 'Invalid model ID' }), {
			status: 400,
		});
	}

	// 4. Build System Prompt with Caching Support
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

	// Build dynamic context separately (not cached)
	const dynamicContext = `
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

### previousChat.txt
${context?.previousChat || '(empty)'}
`;

	// For backwards compatibility and estimation (for billing)
	const fullSystemPrompt = systemPrompt + dynamicContext;

	// 5. Forward to OpenRouter
	const controller = new AbortController();
	const abortListener = () => {
		controller.abort();
	};
	req.signal.addEventListener('abort', abortListener);

	let openrouterResponse;
	try {
		// Build the full messages array with system prompts + conversation history
		const openrouterMessages = [
			// Static system prompt - marked for caching
			{
				role: 'system',
				content: systemPrompt,
				// Anthropic-style cache control (OpenRouter passes through for supported models)
				cache_control: { type: 'ephemeral' }
			},
			// Dynamic context - not cached
			{
				role: 'system',
				content: dynamicContext
			},
			// Conversation history from IDE
			...conversationMessages
		];

		const openrouterPayload = {
			model: modelId,
			messages: openrouterMessages,
			stream: true,
			include_reasoning: include_reasoning ?? true,
			tools: MODE_TOOLS[mode] || undefined,
		};

		openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			signal: controller.signal,
			method: 'POST',
			body: JSON.stringify(openrouterPayload),
			headers: {
				'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://resolv.sh',
				'X-Title': 'Resolv IDE',
			},
			cache: 'no-store',
			next: { revalidate: 0 }
		});
	} catch (err: any) {
		req.signal.removeEventListener('abort', abortListener);
		if (err.name === 'AbortError' || err.message?.includes('aborted')) {
			console.log('Client disconnected during fetch initialization');
			return new Response(null, { status: 499 });
		}
		throw err;
	}

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
			let completionCharsCount = 0; // Track output length for estimation fallback

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
									completionCharsCount += delta.length;
									controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ delta })}\n\n`));
								}

								// 3. Handle Reasoning (Optional, if model supports it)
								const reasoning = json.choices?.[0]?.delta?.reasoning;
								if (reasoning) {
									controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify({ reasoning })}\n\n`));
								}

								// 4. Handle Tool Calls
								const toolCalls = json.choices?.[0]?.delta?.tool_calls;
								if (toolCalls) {
									controller.enqueue(encoder.encode(`event: tool_call\ndata: ${JSON.stringify({ tool_calls: toolCalls })}\n\n`));
								}

							} catch (e) {
								// Ignore parse errors
							}
						}
					}
				}
			} catch (err: any) {
				// Ignore disconnect errors - aggressively input check
				const errString = err?.toString() || '';
				const isAborted =
					err?.name === 'AbortError' ||
					err?.name === 'ResponseAborted' ||
					err?.message?.includes('aborted') ||
					err?.message?.includes('ResponseAborted') ||
					err?.code === 'ECONNRESET' ||
					errString.includes('ResponseAborted') ||
					errString.includes('aborted');

				if (isAborted) {
					console.log('Client/Upstream disconnected');
				} else {
					console.error('Stream processing error:', err);
					controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Stream interrupted' })}\n\n`));
				}
			} finally {
				// Done event
				try {
					controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
					controller.close();
				} catch (e) {
					// Ignore error if controller is already closed or client disconnected
				}

				req.signal.removeEventListener('abort', abortListener);

				// 7. Async Billing
				try {
					// Fallback to estimation if usage stats are missing (e.g. forced abort)
					if (promptTokens === 0 && completionTokens === 0) {
						// Calculate total character count from all conversation messages
						const conversationChars = conversationMessages.reduce((total: number, msg: any) => {
							return total + (msg.content?.length || 0);
						}, 0);
						const estimatedPromptChars = (fullSystemPrompt?.length || 0) + conversationChars;

						// Estimation: ~4 chars per token
						promptTokens = Math.ceil(estimatedPromptChars / 4);
						completionTokens = Math.ceil(completionCharsCount / 4);

						console.log(`[Billing] Partial/Aborted request. Estimated tokens: ${promptTokens}in/${completionTokens}out`);
					}

					if (promptTokens > 0 || completionTokens > 0) {
						const baseCost = calculateBaseCostFromTokens(modelId, promptTokens, completionTokens);
						console.log(`[Billing] User ${userId}: ${modelId} | ${promptTokens}in/${completionTokens}out | $${baseCost}`);
						recordChatUsageAsync(userId, modelId, baseCost, session_id, isTurnStart);
					} else {
						console.warn('[Billing] No usage stats found in stream for user', userId);
					}
				} catch (billingErr) {
					console.error('Billing error in finally block:', billingErr);
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
