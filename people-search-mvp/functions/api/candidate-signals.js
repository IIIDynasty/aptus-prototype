import { evaluateLikelyToSwitchSignals } from '../../services/marketInsightsEngine.js';

export async function onRequestPost(context) {
  const { request } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { candidate, searchContext } = body || {};

    if (!candidate) {
      return new Response(JSON.stringify({ error: 'Candidate profile is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const likelyToSwitch = evaluateLikelyToSwitchSignals(candidate, searchContext || {});
    return new Response(JSON.stringify({ success: true, likelyToSwitch }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to evaluate candidate signals', details: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
