export const maxDuration = 60;

export async function POST(request) {
  try {
    const gotenbergUrl = process.env.GOTENBERG_URL?.trim().replace(/\/$/, '');

    if (!gotenbergUrl) {
      return Response.json(
        { error: 'Conversion server not configured. Add GOTENBERG_URL to Vercel environment variables.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const incomingForm = await request.formData();
    const file = incomingForm.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const form = new FormData();
    let endpoint;
    let outputExt = 'pdf';

    // Gotenberg v8 correct endpoints:
    // LibreOffice → /forms/libreoffice/convert  (output format via nativePdfFormat or filename extension)
    // Chromium HTML → /forms/chromium/convert/html
    switch (type) {
      case 'docx':
      case 'pptx':
      case 'xlsx':
        endpoint = '/forms/libreoffice/convert';
        form.append('files', file);
        outputExt = 'pdf';
        break;

      case 'pdf-to-docx':
        // Gotenberg can convert PDF→DOCX via LibreOffice
        endpoint = '/forms/libreoffice/convert';
        form.append('files', file);
        // Tell LibreOffice to output as DOCX
        form.append('nativePdfFormat', 'false');
        outputExt = 'docx';
        break;

      case 'html':
        endpoint = '/forms/chromium/convert/html';
        form.append('files', file);
        form.append('paperWidth', '8.5');
        form.append('paperHeight', '11');
        form.append('marginTop', '0.5');
        form.append('marginBottom', '0.5');
        form.append('marginLeft', '0.5');
        form.append('marginRight', '0.5');
        outputExt = 'pdf';
        break;

      default:
        return Response.json({ error: `Unknown conversion type: "${type}"` }, { status: 400 });
    }

    let response;
    try {
      response = await fetch(`${gotenbergUrl}${endpoint}`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(55000),
      });
    } catch (fetchErr) {
      return Response.json(
        { error: `Cannot reach conversion server. (${fetchErr.message})` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return Response.json(
          { error: `Gotenberg returned a ${response.status} error. The Space may be waking up — wait 30s and retry.` },
          { status: 502 }
        );
      }
      const errorText = await response.text().catch(() => 'No details');
      return Response.json(
        { error: `Conversion failed (${response.status}): ${errorText.slice(0, 300)}` },
        { status: response.status }
      );
    }

    const resultBytes = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new Response(resultBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${outputExt}"`,
        'X-Processed-By': 'PDFPro',
      },
    });

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return Response.json(
        { error: 'Conversion timed out. Try again — the server may have been waking up.' },
        { status: 504 }
      );
    }
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
