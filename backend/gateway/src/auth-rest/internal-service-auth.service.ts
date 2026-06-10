import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

type ServiceTokenResponse = {
  data?: {
    accessToken?: string;
  };
};

@Injectable()
export class InternalServiceAuthService {
  private readonly logger = new Logger(
    InternalServiceAuthService.name,
  );
  private readonly ms4RestUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly cacheSkewMs: number;

  private cachedToken: string | null = null;
  private cachedTokenExpiresAt = 0;
  private pendingTokenRequest:
    | Promise<string>
    | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const ms4RestUrl =
      this.configService.get<string>('ms4.restUrl');

    if (!ms4RestUrl) {
      throw new InternalServerErrorException(
        'MS4_REST_URL is not configured',
      );
    }

    this.ms4RestUrl = ms4RestUrl;
    this.clientId =
      this.configService.get<string>(
        'internalAuth.clientId',
      ) || '';
    this.clientSecret =
      this.configService.get<string>(
        'internalAuth.clientSecret',
      ) || '';
    this.cacheSkewMs =
      this.configService.get<number>(
        'internalAuth.cacheSkewMs',
      ) || 60000;
  }

  async getAuthorizationHeader(): Promise<string> {
    const accessToken =
      await this.getAccessToken();
    return `Bearer ${accessToken}`;
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (
      this.cachedToken &&
      now <
        this.cachedTokenExpiresAt -
          this.cacheSkewMs
    ) {
      return this.cachedToken;
    }

    if (this.pendingTokenRequest) {
      return this.pendingTokenRequest;
    }

    this.pendingTokenRequest =
      this.fetchAccessToken();

    try {
      return await this.pendingTokenRequest;
    } finally {
      this.pendingTokenRequest = null;
    }
  }

  private async fetchAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException(
        'Las credenciales internas no estan configuradas en el gateway.',
      );
    }

    const response =
      await firstValueFrom(
        this.httpService.post<ServiceTokenResponse>(
          `${this.ms4RestUrl}/auth/service-token`,
          {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
          },
        ),
      );

    const accessToken =
      response.data?.data?.accessToken;

    if (!accessToken) {
      throw new InternalServerErrorException(
        'El servicio auth no devolvio un accessToken tecnico valido.',
      );
    }

    this.cachedToken = accessToken;
    this.cachedTokenExpiresAt =
      this.extractExpirationTime(
        accessToken,
      );

    this.logger.debug(
      `Token tecnico actualizado para ${this.clientId}.`,
    );

    return accessToken;
  }

  private extractExpirationTime(
    token: string,
  ): number {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return Date.now();
    }

    try {
      const payload = JSON.parse(
        Buffer.from(
          parts[1],
          'base64url',
        ).toString('utf8'),
      ) as { exp?: number };

      if (
        typeof payload.exp === 'number'
      ) {
        return payload.exp * 1000;
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo leer la expiracion del token tecnico: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }

    return Date.now();
  }
}
