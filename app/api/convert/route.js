export const maxDuration = 60; // 60 seconds for file conversion

export async function POST(request) {
  try {
    const gotenbergUrl = process.env.GOTENBERG_URL;
    if (!gotenbergUrl) {
      return Response.json(
        { error: 'Conversion server not configured. Please set GOTENBERG_URL in environment variables.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // docx, pptx, xlsx, pdf-to-docx, html

    const incomingForm = await request.formData();
    const file = incomingForm.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const form = new FormData();

    let endpoint;

    switch (type) {
      case 'docx':
      case 'pptx':
      case 'xlsx':
        endpoint = '/forms/libreoffice/convert/pdf';
        form.append('files', file);
        break;

      case 'pdf-to-docx':
        endpoint = '/forms/libreoffice/convert/docx';
        form.append('files', file);
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
        break;

      default:
        return Response.json({ error: `Unknown conversion type: ${type}` }, { status: 400 });
    }

    const response = await fetch(`${gotenbergUrl}${endpoint}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Conversion failed: ${errorText}` },
        { status: response.status }
      );
    }

    const resultBytes = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new Response(resultBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="converted.${type === 'pdf-to-docx' ? 'docx' : 'pdf'}"`,
        'X-Processed-By': 'PDFPro',
      },
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return Response.json({ error: 'Conversion timed out. Please try with a smaller file.' }, { status: 504 });
    }
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
