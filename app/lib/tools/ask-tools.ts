// Ask Agent Tool Definitions for OpenRouter API
// These are the JSON schemas that OpenRouter/OpenAI expects for function calling

export const ASK_MODE_TOOLS = [
    // File System (Read-Only)
    {
        type: 'function',
        function: {
            name: 'fs.read',
            description: 'Read file content with optional line range. Returns the file content as a string.',
            parameters: {
                type: 'object',
                properties: {
                    resource: { 
                        type: 'string', 
                        description: 'File path relative to workspace root' 
                    },
                    startLine: { 
                        type: 'number', 
                        description: 'First line to read (1-indexed, optional)' 
                    },
                    endLine: { 
                        type: 'number', 
                        description: 'Last line to read (1-indexed, optional)' 
                    }
                },
                required: ['resource']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'fs.list',
            description: 'List directory contents. Returns array of file/directory names (basenames only).',
            parameters: {
                type: 'object',
                properties: {
                    resource: { 
                        type: 'string', 
                        description: 'Directory path relative to workspace root' 
                    }
                },
                required: ['resource']
            }
        }
    },

    // Search
    {
        type: 'function',
        function: {
            name: 'search.semantic',
            description: 'Semantic search over codebase using vector similarity. Returns SearchResult[] with path, content, score, startLine, endLine, chunkType, chunkName, nodeId.',
            parameters: {
                type: 'object',
                properties: {
                    query: { 
                        type: 'string', 
                        description: 'Natural language search query' 
                    },
                    limit: { 
                        type: 'number', 
                        description: 'Maximum results to return (default 10)' 
                    },
                    options: {
                        type: 'object',
                        description: 'Optional filters',
                        properties: {
                            fileTypes: { 
                                type: 'array', 
                                items: { type: 'string' },
                                description: 'Filter by extensions, e.g. [\".ts\", \".tsx\"]'
                            },
                            pathPrefix: { 
                                type: 'string', 
                                description: 'Filter by path prefix, e.g. \"src/components\"'
                            },
                            chunkTypes: { 
                                type: 'array', 
                                items: { type: 'string' },
                                description: 'Filter by chunk type: function, class, import, block, lines'
                            }
                        }
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search.linear',
            description: 'Text search using ripgrep. Fast exact matching. Returns SearchResult[] with path, content, startLine.',
            parameters: {
                type: 'object',
                properties: {
                    query: { 
                        type: 'string', 
                        description: 'Exact text to search for' 
                    },
                    limit: { 
                        type: 'number', 
                        description: 'Maximum results (default 20)' 
                    }
                },
                required: ['query']
            }
        }
    },

    // Merkle Tree
    {
        type: 'function',
        function: {
            name: 'merkle.getSmartContext',
            description: 'Get rich context for a symbol: definition source code, parent scope, interfaces, superClasses, and referrers (paginated, 20 per page). Referrers are in format \"file.ts:lineNum\".',
            parameters: {
                type: 'object',
                properties: {
                    symbol: { 
                        type: 'string', 
                        description: 'Symbol name or node path (e.g. \"AuthService\" or \"src/auth.ts#AuthService\")' 
                    },
                    continuationToken: { 
                        type: 'string', 
                        description: 'Token for paginating referrers (from previous response)' 
                    }
                },
                required: ['symbol']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'merkle.getFileSkeleton',
            description: 'Get file structure outline without full content. Shows classes, functions, methods with their signatures. Saves tokens for large files.',
            parameters: {
                type: 'object',
                properties: {
                    resource: { 
                        type: 'string', 
                        description: 'File path relative to workspace' 
                    }
                },
                required: ['resource']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'merkle.readNode',
            description: 'Read a specific code node (file, class, method, function) directly from Merkle tree. Returns INodeContent with path, type, content, startLine, endLine, signature.',
            parameters: {
                type: 'object',
                properties: {
                    nodePath: { 
                        type: 'string', 
                        description: 'Node path: \"file.ts\" for files, \"file.ts#ClassName.methodName\" for nested nodes' 
                    }
                },
                required: ['nodePath']
            }
        }
    },

    // Terminal
    {
        type: 'function',
        function: {
            name: 'terminal.runCommand',
            description: 'Run a shell command. Returns CommandResult with status (completed/input_required/still_running), exit code, output, and terminalId.',
            parameters: {
                type: 'object',
                properties: {
                    command: { 
                        type: 'string', 
                        description: 'Shell command to execute' 
                    },
                    cwd: { 
                        type: 'string', 
                        description: 'Working directory (optional)' 
                    },
                    timeoutMs: { 
                        type: 'number', 
                        description: 'Timeout in milliseconds (default 30000)' 
                    }
                },
                required: ['command']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'terminal.sendInput',
            description: 'Send input to a running terminal. Use for interactive prompts (e.g. confirmations).',
            parameters: {
                type: 'object',
                properties: {
                    terminalId: { 
                        type: 'string', 
                        description: 'Terminal ID from runCommand result' 
                    },
                    text: { 
                        type: 'string', 
                        description: 'Input to send (include \\n for Enter)' 
                    }
                },
                required: ['terminalId', 'text']
            }
        }
    },

    // Memory - Chat Session
    {
        type: 'function',
        function: {
            name: 'memory.readTodo',
            description: 'Read your task checklist (todo.md).',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.writeTodo',
            description: 'Write to your task checklist (todo.md). Overwrites entire file.',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'New todo.md content' }
                },
                required: ['content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.readNotes',
            description: 'Read your research notes (notes.txt).',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.writeNotes',
            description: 'Write to your research notes (notes.txt). Overwrites entire file.',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'New notes.txt content' }
                },
                required: ['content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.readContinuity',
            description: 'Read session state (continuity.txt).',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.writeContinuity',
            description: 'Write session state (continuity.txt). For tracking where you left off.',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'New continuity.txt content' }
                },
                required: ['content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.readDiff',
            description: 'Read changes log (diff.txt).',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.writeDiff',
            description: 'Write to changes log (diff.txt).',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'New diff.txt content' }
                },
                required: ['content']
            }
        }
    },

    // Memory - Project (Shared across sessions)
    {
        type: 'function',
        function: {
            name: 'memory.readProject',
            description: 'Read project architecture documentation (project.txt). Shared across all sessions.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'memory.writeProject',
            description: 'Write project architecture documentation (project.txt). Use to document discovered patterns, architecture, key files. Shared across all sessions.',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'New project.txt content' }
                },
                required: ['content']
            }
        }
    }
];
