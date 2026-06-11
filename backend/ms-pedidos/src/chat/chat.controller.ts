/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';

@Controller('api/v1/delivery/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('texto')
  async chatTexto(
    @Body('mensaje') mensaje: string,
    @Headers('authorization') authHeader?: string,
  ) {
    if (!mensaje) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    return this.chatService.procesarMensajeTexto(mensaje, authHeader);
  }

  @Post('audio')
  @UseInterceptors(FileInterceptor('file'))
  async chatAudio(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debe subir un archivo de audio para procesar',
      );
    }
    this.logger.log(
      `Recibió archivo de audio en controller: ${file.originalname}, mimetype: ${file.mimetype}`,
    );

    // Si el tipo de archivo no está en formato correcto de audio, podemos intentar pasarlo de todas formas,
    // o forzar un mimetype genérico si viene de Expo con mimetypes raros de audio.
    let mimetype = file.mimetype;
    if (
      mimetype === 'application/octet-stream' &&
      file.originalname.endsWith('.m4a')
    ) {
      mimetype = 'audio/mp4';
    } else if (
      mimetype === 'application/octet-stream' &&
      file.originalname.endsWith('.wav')
    ) {
      mimetype = 'audio/wav';
    }

    return this.chatService.procesarMensajeAudio(
      file.buffer,
      mimetype,
      authHeader,
    );
  }
}
