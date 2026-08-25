import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, tags, notes, estado, cita_odoo_id } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (tags !== undefined) updatePayload.tags = tags;
    if (notes !== undefined) updatePayload.notes = notes;
    if (estado !== undefined) updatePayload.estado = estado;
    if (cita_odoo_id !== undefined) updatePayload.cita_odoo_id = cita_odoo_id;

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update(updatePayload)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
