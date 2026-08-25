import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, tenantId, sessionId, appointmentId, payload } = await request.json();

    if (!action || !tenantId) {
      return NextResponse.json({ error: 'Acción y tenantId son requeridos' }, { status: 400 });
    }

    if (action === 'CANCEL_APPOINTMENT') {
      if (sessionId) {
        const { data: sessionData } = await supabaseAdmin
          .from('chat_sessions')
          .select('history')
          .eq('id', sessionId)
          .single();

        const updatedHistory = [
          ...(sessionData?.history || []),
          {
            role: 'system',
            content: JSON.stringify({
              action: 'CANCEL',
              status: 'cancelled',
              timestamp: new Date().toISOString(),
              reason: payload?.reason || 'Cancelado manualmente por asesor en CRM',
            }),
          },
        ];

        await supabaseAdmin
          .from('chat_sessions')
          .update({
            estado: 'cancelado',
            history: updatedHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }

      return NextResponse.json({
        success: true,
        message: `Cita #${appointmentId || 'actual'} cancelada y sincronizada.`,
      });
    }

    if (action === 'RESCHEDULE_APPOINTMENT' || action === 'CREATE_APPOINTMENT') {
      if (sessionId) {
        const { data: sessionData } = await supabaseAdmin
          .from('chat_sessions')
          .select('history')
          .eq('id', sessionId)
          .single();

        const updatedHistory = [
          ...(sessionData?.history || []),
          {
            role: 'system',
            content: JSON.stringify({
              action: 'BOOK',
              service: payload?.service || 'Servicio Agendado',
              professional: payload?.professional || 'Jose Roa',
              date: payload?.date,
              time: payload?.time,
              price: payload?.price || 45000,
            }),
          },
        ];

        await supabaseAdmin
          .from('chat_sessions')
          .update({
            estado: 'cita_agendada',
            history: updatedHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }

      return NextResponse.json({
        success: true,
        message: 'Cita agendada/reprogramada exitosamente.',
      });
    }

    return NextResponse.json({ success: true, message: 'Acción procesada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
