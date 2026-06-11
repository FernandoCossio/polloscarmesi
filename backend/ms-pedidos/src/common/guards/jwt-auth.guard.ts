import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private publicKey: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.loadPublicKey();
  }

  private loadPublicKey() {
    try {
      const relPath = this.configService.get<string>('jwt.publicKeyPath', '../certs/public.pem');
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        this.publicKey = fs.readFileSync(fullPath, 'utf8');
        this.logger.log(`JWT public key loaded successfully from: ${fullPath}`);
      } else {
        this.logger.error(`JWT public key not found at: ${fullPath}`);
      }
    } catch (err) {
      this.logger.error(`Error loading JWT public key: ${err.message}`);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new UnauthorizedException('Invalid Authorization format. Use Bearer <token>');
    }

    const token = match[1].trim();
    const user = this.verifyToken(token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = user;
    return true;
  }

  private verifyToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;

    let header: any;
    let payload: any;
    try {
      header = this.parseJsonPart(headerPart);
      payload = this.parseJsonPart(payloadPart);
    } catch {
      return null;
    }

    // Check expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload?.exp === 'number' && nowSeconds >= payload.exp) {
      this.logger.warn('Token has expired');
      return null;
    }

    if (!this.publicKey) {
      this.logger.error('Public key not loaded, cannot verify JWT signature');
      // If public key is not loaded, we can fallback to decoded payload in dev to prevent hard lock
      if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
        return this.getUserFromPayload(payload);
      }
      return null;
    }

    // Verify signature
    const alg = header?.alg;
    if (alg !== 'RS256' && alg !== 'RS512') return null;

    const data = `${headerPart}.${payloadPart}`;
    const signature = this.base64UrlToBuffer(signaturePart);

    try {
      const key = crypto.createPublicKey(this.publicKey);
      const verified = crypto.verify(
        alg === 'RS256' ? 'RSA-SHA256' : 'RSA-SHA512',
        Buffer.from(data, 'utf8'),
        key,
        signature,
      );

      if (!verified) {
        this.logger.warn('JWT signature verification failed');
        return null;
      }

      return this.getUserFromPayload(payload);
    } catch (err) {
      this.logger.error(`Error verifying signature: ${err.message}`);
      return null;
    }
  }

  private getUserFromPayload(payload: any) {
    const roles = Array.isArray(payload?.roles) ? payload.roles.filter((r: any) => typeof r === 'string') : [];
    const role =
      typeof payload?.role === 'string'
        ? payload.role
        : roles.length > 0
          ? roles[0]
          : undefined;

    const userId =
      typeof payload?.userId === 'string'
        ? payload.userId
        : typeof payload?.uid === 'string'
          ? payload.uid
          : typeof payload?.sub === 'string'
            ? payload.sub
            : typeof payload?.username === 'string'
              ? payload.username
              : undefined;

    if (!userId && !role) return null;
    return { userId: Number(userId) || userId, role, roles };
  }

  private parseJsonPart(part: string): any {
    const json = this.base64UrlToBuffer(part).toString('utf8');
    return JSON.parse(json);
  }

  private base64UrlToBuffer(input: string): Buffer {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return Buffer.from(base64, 'base64');
  }
}
