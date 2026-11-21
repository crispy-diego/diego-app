// Función de servidor (Supabase Edge Function): devuelve los eventos de un día
// de todas las cuentas de Google Calendar conectadas en Composio.
//
// La llave de Composio vive aquí como secreto y nunca llega al teléfono.
// Solo responde a la cuenta cuyo correo coincide con ALLOWED_EMAIL.
//
// Secretos necesarios:  COMPOSIO_API_KEY, ALLOWED_EMAIL
// (SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase automáticamente.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const COMPOSIO = 'https://backend.composio.dev/api/v3.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function composio(path: string, init: RequestInit = {}) {
  const res = await fetch(`${COMPOSIO}${path}`, {
    ...init,
    headers: { 'x-api-key': Deno.env.get('COMPOSIO_API_KEY') ?? '', 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`Composio ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // 1. ¿Quién llama? Debe ser tu cuenta.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: auth } = await supabase.auth.getUser();
    const allowed = (Deno.env.get('ALLOWED_EMAIL') ?? '').toLowerCase();
    if (!auth.user?.email || !allowed || auth.user.email.toLowerCase() !== allowed) return json({ error: 'No autorizado' }, 401);

    // 2. ¿Qué día? "day" = YYYY-MM-DD, "offset" = diferencia horaria del teléfono, p. ej. "-06:00".
    const { day, offset } = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[+-]\d{2}:\d{2}$/.test(offset)) return json({ error: 'Parámetros inválidos' }, 400);
    const timeMin = `${day}T00:00:00${offset}`;
    const next = new Date(`${day}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const timeMax = `${next.toISOString().slice(0, 10)}T00:00:00${offset}`;

    // 3. Cuentas de Google Calendar conectadas.
    const accounts = await composio('/connected_accounts?toolkit_slugs=googlecalendar&statuses=ACTIVE');

    // 4. Eventos del día de cada cuenta.
    const perAccount = await Promise.all(
      (accounts.items ?? []).map(async (acc: { id: string; user_id?: string }, index: number) => {
        const out = await composio('/tools/execute/GOOGLECALENDAR_EVENTS_LIST', {
          method: 'POST',
          body: JSON.stringify({
            connected_account_id: acc.id,
            user_id: acc.user_id,
            arguments: { calendarId: 'primary', timeMin, timeMax, singleEvents: true, orderBy: 'startTime' },
          }),
        });
        const calendar: string = out.data?.summary ?? '';
        // deno-lint-ignore no-explicit-any
        return (out.data?.items ?? []).map((e: any) => ({
          id: `${acc.id}:${e.id}`,
          title: e.summary ?? '(Sin título)',
          start: e.start?.dateTime ?? e.start?.date ?? '',
          end: e.end?.dateTime ?? e.end?.date ?? '',
          allDay: !e.start?.dateTime,
          place: e.location ?? '',
          calendar,
          calendarIndex: index,
          // deno-lint-ignore no-explicit-any
          people: (e.attendees ?? []).filter((a: any) => !a.self).map((a: any) => a.displayName ?? a.email),
          notes: e.description ?? '',
        }));
      }),
    );

    const events = perAccount.flat().sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
    return json({ events });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error desconocido' }, 500);
  }
});
