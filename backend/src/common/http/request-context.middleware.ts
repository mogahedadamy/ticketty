import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function normalizeRequestId(value: unknown): string {
  return typeof value === 'string' && SAFE_REQUEST_ID.test(value)
    ? value
    : randomUUID();
}

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const requestId = normalizeRequestId(request.headers['x-request-id']);
    const startedAt = process.hrtime.bigint();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    response.once('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      this.logger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          clientIp: request.ip,
          durationMs: Math.round(durationMs * 100) / 100,
        }),
      );
    });

    next();
  }
}
