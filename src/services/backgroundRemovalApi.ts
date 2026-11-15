export class BackgroundRemovalApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.name = 'BackgroundRemovalApiError';
    this.status = status;
    this.code = code;
  }
}

export async function removeBackground(
  file: File,
  signal?: AbortSignal,
): Promise<Blob> {
  const formData = new FormData();
  formData.append('image', file);

  let response: Response;
  try {
    response = await fetch('/api/remove-background', {
      method: 'POST',
      body: formData,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new BackgroundRemovalApiError(
      'Network error while connecting to the background removal server. Please check your connection and try again.',
      0,
      'NETWORK_ERROR',
    );
  }

  if (!response.ok) {
    let errorMessage = 'Background removal failed. Please try again.';
    let errorCode = 'API_ERROR';

    try {
      const payload = (await response.json()) as { error?: string; code?: string };
      if (payload.error) {
        errorMessage = payload.error;
      }
      if (payload.code) {
        errorCode = payload.code;
      }
    } catch {
      if (response.status === 429) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.';
        errorCode = 'RATE_LIMITED';
      } else if (response.status >= 500) {
        errorMessage = 'The server encountered an error processing this image. Please try again.';
        errorCode = 'SERVER_ERROR';
      }
    }

    throw new BackgroundRemovalApiError(errorMessage, response.status, errorCode);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image/png')) {
    throw new BackgroundRemovalApiError(
      'Unexpected response format from the background removal service.',
      response.status,
      'INVALID_RESPONSE_TYPE',
    );
  }

  return await response.blob();
}
