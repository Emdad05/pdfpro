/**
 * POST /api/analyze-slide
 * Proxies image to Claude Vision API server-side.
 * API key stays in environment — never exposed to browser.
 */
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to Vercel environment variables.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { base64, mimeType } = body;
  if (!base64 || !mimeType) {
    return Response.json({ error: 'Missing base64 or mimeType' }, { status: 400 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-opus-4-5',
      max_tokens: 4096,
      system: `You are a precise slide layout extractor. Analyze the image and extract every visible text element with its exact position.

Return ONLY valid JSON — no markdown fences, no explanation.

{
  "slideAspect": "16:9",
  "hasComplexBackground": true,
  "backgroundColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "text": "exact text content",
      "xPct": 0.28,
      "yPct": 0.37,
      "wPct": 0.44,
      "hPct": 0.13,
      "fontSize": 34,
      "bold": true,
      "italic": false,
      "align": "center",
      "color": "#1a2955",
      "fontFamily": "Calibri"
    }
  ]
}

POSITION RULES (critical):
- xPct, yPct = top-left corner as fraction of image width/height (0.0–1.0)
- wPct, hPct = width/height as fraction of image dimensions
- Be precise. A centered element with 44% width starts at xPct=0.28
- fontSize in points (headings: 28–48pt, body: 12–20pt)
- color: hex string of the actual text colour
- hasComplexBackground: true if slide has photo/gradient/coloured shapes/patterns`,

      messages: [{
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mimeType, data: base64 },
          },
          {
            type: 'text',
            text: 'Extract all text elements with precise positions.',
          },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json(
      { error: `Claude API error ${res.status}: ${err.slice(0, 300)}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const raw  = data.content?.[0]?.text || '';
  const clean = raw.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();

  try {
    const layout = JSON.parse(clean);
    return Response.json(layout);
  } catch {
    return Response.json(
      { error: 'Claude returned invalid JSON', raw: clean.slice(0, 500) },
      { status: 500 }
    );
  }
}
