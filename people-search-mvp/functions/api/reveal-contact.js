import { findCandidateEmail } from '../../services/hunterService.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { firstName, lastName, domain, companyName } = body || {};

    if (!firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'firstName and lastName are required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const contactData = await findCandidateEmail({ firstName, lastName, domain, companyName }, env.HUNTER_API_KEY);
    return new Response(JSON.stringify({
      success: true,
      contact: contactData
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to retrieve contact information',
      details: error.message
    }), {
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
