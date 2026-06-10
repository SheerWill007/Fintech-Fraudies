import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException(
        'Webhook ingestion is disabled (set WEBHOOK_SECRET for the API).',
      );
    }

    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const headerRaw = req.headers['x-webhook-secret'];
    const header = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
    if (!header) {
      throw new UnauthorizedException('Missing X-Webhook-Secret header');
    }

    const a = Buffer.from(header, 'utf8');
    const b = Buffer.from(secret, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
