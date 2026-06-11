import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispositivoToken } from '../entities/dispositivo-token.entity';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly expo: Expo;

  constructor(
    @InjectRepository(DispositivoToken)
    private readonly tokenRepo: Repository<DispositivoToken>,
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.get<string>('expo.accessToken');
    this.expo = new Expo({ accessToken: token || undefined });
  }

  async registrarToken(
    userId: number,
    rol: string,
    expoPushToken: string,
    plataforma?: string,
  ): Promise<DispositivoToken> {
    let tokenEntity = await this.tokenRepo.findOne({ where: { expoPushToken } });

    if (!tokenEntity) {
      tokenEntity = new DispositivoToken();
      tokenEntity.expoPushToken = expoPushToken;
    }

    tokenEntity.userId = userId;
    tokenEntity.rol = rol;
    tokenEntity.plataforma = plataforma || null;
    tokenEntity.activo = true;

    return this.tokenRepo.save(tokenEntity);
  }

  async desactivarToken(expoPushToken: string): Promise<void> {
    const tokenEntity = await this.tokenRepo.findOne({ where: { expoPushToken } });
    if (tokenEntity) {
      tokenEntity.activo = false;
      await this.tokenRepo.save(tokenEntity);
      this.logger.log(`Deactivated push token: ${expoPushToken}`);
    }
  }

  async enviarNotificacion(
    userId: number,
    title: string,
    body: string,
    data?: any,
  ): Promise<boolean> {
    const tokens = await this.tokenRepo.find({
      where: { userId, activo: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active push tokens found for user ID: ${userId}`);
      return false;
    }

    const messages: ExpoPushMessage[] = [];
    for (const t of tokens) {
      if (!Expo.isExpoPushToken(t.expoPushToken)) {
        this.logger.warn(`Invalid Expo push token: ${t.expoPushToken}. Deactivating.`);
        await this.desactivarToken(t.expoPushToken);
        continue;
      }

      messages.push({
        to: t.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    if (messages.length === 0) {
      return false;
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    let success = true;

    for (const chunk of chunks) {
      let attempts = 0;
      let sentSuccessfully = false;

      while (attempts < 3 && !sentSuccessfully) {
        attempts++;
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.log(`Push notifications chunk sent successfully. Tickets count: ${tickets.length}`);
          sentSuccessfully = true;
        } catch (err) {
          this.logger.error(`Attempt ${attempts} failed to send push notification chunk: ${err.message}`);
          if (attempts >= 3) {
            success = false;
          } else {
            // exponential backoff
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }
    }

    return success;
  }
}
