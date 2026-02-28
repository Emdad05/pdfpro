/**
 * Sends a file to our Vercel API route which proxies to Gotenberg.
 * This keeps the Gotenberg URL secret (server-side only).
 */
export async function convertViaServer(file, type, onStatus) {
  onStatus?.('Connecting to conversion server...');

  const form = new FormData();
  form.append('file', file);

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      onStatus?.(attempts > 0 ? 'Retrying...' : 'Uploading file...');

      const response = await fetch(`/api/convert?type=${type}`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      onStatus?.('Processing...');
      const blob = await response.blob();
      return blob;

    } catch (err) {
      attempts++;
      if (attempts >= maxAttempts) throw err;
      // Wait 2s before retry
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
