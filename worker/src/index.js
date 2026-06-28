export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const API_KEY = env.YOUTUBE_API_KEY;

    try {
      if (path === '/channels') {
        const handle = url.searchParams.get('handle');
        const channelId = url.searchParams.get('id');
        
        let apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&key=${API_KEY}`;
        if (handle) apiUrl += `&forHandle=${handle}`;
        if (channelId) apiUrl += `&id=${channelId}`;

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/playlist-items') {
        const playlistId = url.searchParams.get('playlistId');
        const maxResults = url.searchParams.get('maxResults') || '50';
        const pageToken = url.searchParams.get('pageToken') || '';
        
        let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${API_KEY}`;
        
        if (pageToken) {
          apiUrl += `&pageToken=${pageToken}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
