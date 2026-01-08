# Backend API Specification

This document specifies exactly what the backend needs to implement to work with the editor.

> [!IMPORTANT]
> **All requests include an Authorization header:**
> ```
> Authorization: Bearer {accessToken}
> ```
> The backend MUST validate this JWT before processing requests.

---

## Endpoint: `POST /api/chat`

### Request Body

```typescript
interface ChatRequest {
  // Mode: 'expert' | 'general_agent' | 'ask'
  mode: 'expert' | 'general_agent' | 'ask';

  // Model ID (from /api/models registry)
  modelId: string;

  // Current user message
  message: string;

  // Expert mode specific (optional)
  expertStep?: 'supervisor' | 'planner' | 'executor' | 'auditor';
  action?: 'review_lspec' | 'start_planner' | 'start_executor' | 'start_auditor' | 'finalize';

  // Context files from .resolv folder
  context: {
    todo?: string;         // todo.md contents
    notes?: string;        // notes.txt contents
    continuity?: string;   // continuity.txt contents
    diff?: string;         // diff.txt contents
    project?: string;      // project.txt contents
    userFiles?: Record<string, string>;
  };

  // Step-specific artifact (e.g., lspec content for supervisor)
  artifact?: string;

  // Tool definitions (for executor/general_agent)
  tools?: ToolDefinition[];
}
```

### Response: Server-Sent Events (SSE)

The response MUST be `Content-Type: text/event-stream` with SSE format:

```
event: content
data: {"delta": "Here's what I found..."}

event: content
data: {"delta": " Let me analyze this."}

event: tool_call
data: {"id": "call_123", "function": {"name": "read_file", "arguments": "{\"path\": \"src/index.ts\"}"}}

event: suggestion
data: {"type": "ready_for_next_step", "message": "All questions resolved", "nextStep": "planner"}

event: done
data: {}
```

### Event Types

| Event | Purpose | Data Shape |
|-------|---------|------------|
| `content` | Streaming text | `{ delta: string }` |
| `tool_call` | Request tool execution | `{ id, function: { name, arguments } }` |
| `suggestion` | Suggest next step (not force) | `{ type, message, nextStep? }` |
| `questions` | New questions (supervisor) | `{ newQuestions: [...] }` |
| `artifact_update` | Write to artifact file | `{ path, content }` |
| `error` | Error occurred | `{ message: string }` |
| `done` | Stream complete | `{}` |

---

## Mode Instructions

Backend loads different system prompts based on [mode](file:///d:/aide/aide/src/vs/workbench/services/ai/expertModeService.ts#33-34):

### Expert Mode
```
mode: 'expert'
expertStep: 'supervisor' | 'planner' | 'executor' | 'auditor'
```

Backend should have different prompts for each step. See the docs for full prompts.

### General Agent Mode
```
mode: 'general_agent'
```

Single-pass execution with tool access.

### Ask Mode
```
mode: 'ask'
```

Read-only Q&A, no tools.

---

## Minimal Next.js Implementation

```typescript
// app/api/chat/route.ts
import { NextRequest } from 'next/server';

const MODE_PROMPTS = {
  expert: {
    supervisor: 'You are the Supervisor agent...',
    planner: 'You are the Planner agent...',
    executor: 'You are the Executor agent...',
    auditor: 'You are the Auditor agent...',
  },
  general_agent: 'You are a helpful coding assistant...',
  ask: 'You are a read-only assistant that answers questions...',
};

export async function POST(req: NextRequest) {
  // Validate auth token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.slice(7);
  // TODO: Validate JWT token against your auth system
  // const user = await validateToken(token);

  const body = await req.json();
  const { mode, modelId, message, context, expertStep } = body;

  // 1. Get system prompt for this mode/step
  let systemPrompt: string;
  if (mode === 'expert' && expertStep) {
    systemPrompt = MODE_PROMPTS.expert[expertStep];
  } else {
    systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.general_agent;
  }

  // 2. Build full prompt with context
  const fullSystemPrompt = `${systemPrompt}

## Context Files
### todo.md
${context.todo || '(empty)'}

### notes.txt
${context.notes || '(empty)'}

### continuity.txt
${context.continuity || '(empty)'}

### diff.txt
${context.diff || '(empty)'}

### project.txt
${context.project || '(empty)'}
`;

  // 3. Forward to OpenRouter
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
    }),
  });

  if (!openrouterResponse.ok) {
    const error = await openrouterResponse.text();
    return new Response(`event: error\ndata: ${JSON.stringify({ message: error })}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // 4. Transform OpenRouter stream to our SSE format
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = openrouterResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Testing

You can test with curl:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mode": "general_agent",
    "modelId": "anthropic/claude-3.5-sonnet",
    "message": "Hello, how are you?",
    "context": {}
  }'
```

Expected response (SSE):
```
event: content
data: {"delta": "Hello! I'm doing"}

event: content
data: {"delta": " well, thank you"}

event: done
data: {}
```
