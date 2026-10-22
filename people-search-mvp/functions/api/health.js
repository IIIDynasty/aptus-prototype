export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    status: 'online',
    platform: 'WhoGPT Agents',
    version: '1.0.0-mvp',
    runtime: 'Cloudflare Pages Functions',
    services: {
      groq: Boolean(env?.GROQ_API_KEY),
      pdl: Boolean(env?.PEOPLE_DATA_LABS_API_KEY),
      hunter: Boolean(env?.HUNTER_API_KEY)
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
