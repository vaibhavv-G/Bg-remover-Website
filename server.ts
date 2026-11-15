import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB
const DEFAULT_API_URL = 'https://api.remove.bg/v1.0/removebg';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const normalizedMime = file.mimetype.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      cb(new Error('INVALID_MIME_TYPE'));
      return;
    }
    cb(null, true);
  },
});

async function extractUpstreamErrorMessage(response: globalThis.Response): Promise<string | null> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as {
        errors?: Array<{ title?: string; detail?: string }>;
        error?: string;
        message?: string;
      };
      const firstError = data.errors?.[0];
      return firstError?.title || firstError?.detail || data.error || data.message || null;
    }
    const text = (await response.text()).trim();
    return text.length > 0 && text.length < 240 ? text : null;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/remove-background', (req: Request, res: Response) => {
    upload.single('image')(req, res, async (uploadErr: unknown) => {
      if (uploadErr instanceof multer.MulterError) {
        if (uploadErr.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: 'Image exceeds the 12 MB maximum file size limit.',
            code: 'FILE_TOO_LARGE',
          });
          return;
        }
        res.status(400).json({
          error: 'Could not read uploaded image. Please upload one JPG, PNG, or WebP file.',
          code: 'UPLOAD_ERROR',
        });
        return;
      }

      if (uploadErr instanceof Error && uploadErr.message === 'INVALID_MIME_TYPE') {
        res.status(400).json({
          error: 'Unsupported file format. Only JPG, JPEG, PNG, and WebP images are accepted.',
          code: 'INVALID_FORMAT',
        });
        return;
      }

      if (uploadErr) {
        res.status(400).json({
          error: 'Invalid upload request. Please select a valid image file.',
          code: 'UPLOAD_ERROR',
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: 'No image file was provided. Please select an image to process.',
          code: 'MISSING_FILE',
        });
        return;
      }

      const normalizedMime = file.mimetype.toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(normalizedMime) || !hasValidImageSignature(file.buffer, normalizedMime)) {
        res.status(400).json({
          error: 'The uploaded file does not appear to be a valid JPG, PNG, or WebP image.',
          code: 'INVALID_IMAGE_DATA',
        });
        return;
      }

      const apiKey = process.env.BACKGROUND_REMOVAL_API_KEY?.trim();
      const apiUrl = process.env.BACKGROUND_REMOVAL_API_URL?.trim() || DEFAULT_API_URL;

      if (!apiKey || apiKey === 'MY_BACKGROUND_REMOVAL_API_KEY') {
        res.status(503).json({
          error: 'Background removal service is not configured yet. Please configure your API credentials.',
          code: 'MISSING_CREDENTIALS',
        });
        return;
      }

      try {
        const upstreamForm = new FormData();
        const blobBytes = Uint8Array.from(file.buffer);
        const imageBlob = new Blob([blobBytes], { type: normalizedMime });
        upstreamForm.append('image_file', imageBlob, file.originalname || 'upload.png');
        upstreamForm.append('size', 'auto');
        upstreamForm.append('format', 'png');

        const upstreamResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey,
          },
          body: upstreamForm,
          signal: AbortSignal.timeout(45000),
        });

        if (!upstreamResponse.ok) {
          const upstreamDetail = await extractUpstreamErrorMessage(upstreamResponse);

          if (upstreamResponse.status === 400) {
            res.status(400).json({
              error:
                upstreamDetail ||
                'The image could not be processed. Try a clearer subject in JPG, PNG, or WebP format.',
              code: 'UPSTREAM_BAD_REQUEST',
            });
            return;
          }

          if (upstreamResponse.status === 402) {
            res.status(402).json({
              error: 'Background removal API credits are exhausted. Please check your provider quota.',
              code: 'INSUFFICIENT_CREDITS',
            });
            return;
          }

          if (upstreamResponse.status === 403) {
            res.status(403).json({
              error: 'Background removal API credentials were rejected. Please verify your server API key.',
              code: 'INVALID_CREDENTIALS',
            });
            return;
          }

          if (upstreamResponse.status === 429) {
            const retryAfter = upstreamResponse.headers.get('retry-after');
            if (retryAfter) {
              res.setHeader('Retry-After', retryAfter);
            }
            res.status(429).json({
              error: 'Rate limit reached on the background removal service. Please wait a moment and try again.',
              code: 'RATE_LIMITED',
            });
            return;
          }

          res.status(502).json({
            error: 'Background removal provider returned an unexpected server error. Please try again.',
            code: 'UPSTREAM_SERVER_ERROR',
          });
          return;
        }

        const resultArrayBuffer = await upstreamResponse.arrayBuffer();
        const resultBuffer = Buffer.from(resultArrayBuffer);

        if (resultBuffer.length === 0) {
          res.status(502).json({
            error: 'Background removal service returned an empty response. Please try again.',
            code: 'EMPTY_RESULT',
          });
          return;
        }

        if (!hasValidImageSignature(resultBuffer, 'image/png')) {
          res.status(502).json({
            error: 'Background removal service returned an invalid image format instead of a transparent PNG.',
            code: 'INVALID_UPSTREAM_PNG',
          });
          return;
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Disposition', 'inline; filename="bg-removed.png"');
        res.status(200).send(resultBuffer);
      } catch (error) {
        const isTimeout =
          error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

        if (isTimeout) {
          res.status(504).json({
            error: 'Background removal timed out while waiting for the AI service. Please try again.',
            code: 'UPSTREAM_TIMEOUT',
          });
          return;
        }

        res.status(502).json({
          error: 'Could not reach the background removal service. Please try again shortly.',
          code: 'UPSTREAM_NETWORK_ERROR',
        });
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*path', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({
      error: 'An unexpected server error occurred.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BGRemover Pro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
