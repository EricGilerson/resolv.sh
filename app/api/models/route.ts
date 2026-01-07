import { NextResponse } from 'next/server';
import { PREMIER_MODELS, OPEN_SOURCE_MODELS, Model, ModelsResponse } from '@/app/data/models';
import { createClient } from '@/app/utils/supabase/server';

export async function GET(request: Request) {
    // 1. Verify Authentication
    const supabase = await createClient();

    // Check for Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Explicitly mapping data ensures that if we add sensitive fields to the source file later
    // (e.g., internal config, upstream keys), they are not automatically exposed to the client.

    const sanitizeModel = (model: Model): Model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        contextWindow: model.contextWindow,
        description: model.description,
        capabilities: model.capabilities,
        pricing: model.pricing,
    });

    const response: ModelsResponse = {
        premier: PREMIER_MODELS.map(sanitizeModel),
        openSource: OPEN_SOURCE_MODELS.map(sanitizeModel),
    };

    return NextResponse.json(response, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
