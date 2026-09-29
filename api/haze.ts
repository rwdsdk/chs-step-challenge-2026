// Vercel Edge Function — no framework/extra dependency needed, just the Web
// Request/Response APIs. Fetches PSI + PM2.5 from data.gov.sg once and lets
// Vercel's edge network cache the response for 15 minutes, shared by every
// visitor — protects the small anonymous rate limit (6 req/10s) from a
// simultaneous company-wide rush, which a per-browser client cache can't do.
export const config = { runtime: 'edge' };

async function fetchRegionReadings(endpoint: string, date: string, field: string) {
  const res = await fetch(`https://api-open.data.gov.sg/v2/real-time/api/${endpoint}?date=${date}&paginationToken=`);
  if (!res.ok) throw new Error(`${endpoint} request failed: ${res.status}`);
  const json = await res.json();
  const latest = json?.data?.items?.[0];
  const readings = latest?.readings?.[field];
  if (!readings) throw new Error(`${endpoint} response missing ${field}`);
  return { readings, updatedAt: latest.updatedTimestamp as string };
}

function todaySingaporeDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
}

export default async function handler(): Promise<Response> {
  try {
    const date = todaySingaporeDate();
    const [psi, pm25] = await Promise.all([
      fetchRegionReadings('psi', date, 'psi_twenty_four_hourly'),
      fetchRegionReadings('pm25', date, 'pm25_one_hourly'),
    ]);
    return new Response(
      JSON.stringify({ officialUpdatedAt: psi.updatedAt, psi: psi.readings, pm25: pm25.readings }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Unable to fetch haze data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
