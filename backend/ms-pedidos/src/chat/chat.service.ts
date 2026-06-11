/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ms1GraphqlClient } from '../graphql/client/ms1-graphql.client';

/** Nombre del modelo Gemini por defecto si no se define GEMINI_MODEL en .env */
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly apiKey: string | null;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly ms1GraphqlClient: Ms1GraphqlClient,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.logger.log(
        `Gemini API client initialized successfully ✓ (Model: ${this.modelName})`,
      );
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not defined in environment variables. AI chatbot will run in simulation mode.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Clasifica el error de la API de Gemini y devuelve un mensaje amigable
   * en español para mostrárselo directamente al usuario en la app móvil.
   */
  private classifyGeminiError(err: any, isAudio = false): string {
    const msg: string = err?.message || '';

    if (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('Quota exceeded') ||
      msg.includes('RESOURCE_EXHAUSTED')
    ) {
      return '⚠️ El servicio de inteligencia artificial está temporalmente saturado (cuota de uso alcanzada). Por favor, espera unos minutos e intenta de nuevo.';
    }

    if (msg.includes('503') || msg.includes('Service Unavailable')) {
      return '⚠️ El servidor de IA está experimentando alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.';
    }

    if (
      msg.includes('model output') ||
      msg.includes('output text or tool calls') ||
      msg.includes('finishReason')
    ) {
      if (isAudio) {
        return '🎙️ No pude entender el audio. Asegúrate de hablar claro y cerca del micrófono, o mantén presionado el botón un poco más antes de hablar.';
      }
      return 'No pude generar una respuesta para esa solicitud. ¿Puedes reformular tu pregunta?';
    }

    if (msg.includes('400') || msg.includes('Bad Request')) {
      if (isAudio) {
        return '🎙️ El archivo de audio no pudo ser procesado. Intenta grabar de nuevo con más duración (mínimo 1 segundo de voz).';
      }
      return 'Tu mensaje no pudo ser procesado correctamente. Por favor, intenta de nuevo.';
    }

    if (
      msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('API_KEY') ||
      msg.includes('PERMISSION_DENIED')
    ) {
      return '🔑 Error de autenticación con el servicio de IA. Por favor, contacta al administrador del sistema.';
    }

    if (
      msg.includes('NETWORK') ||
      msg.includes('fetch') ||
      msg.includes('ECONNREFUSED')
    ) {
      return '🌐 No se pudo conectar con el servicio de IA. Verifica tu conexión a internet e intenta de nuevo.';
    }

    if (isAudio) {
      return '❌ No pude procesar tu mensaje de voz. Por favor, intenta de nuevo o escribe tu pedido por texto.';
    }
    return '❌ Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo en unos segundos.';
  }

  private async getSystemInstruction(authHeader?: string): Promise<string> {
    try {
      const menu = await this.ms1GraphqlClient.obtenerMenu(authHeader);
      const menuStr = JSON.stringify(menu, null, 2);
      return `Eres el asistente virtual interactivo por voz y texto de "Pollos Carmesí", una pollería tradicional y de alta calidad.
Tu objetivo es ayudar amablemente a los clientes a responder dudas sobre nuestro menú y actualizar su carrito de compras.

MENÚ OFICIAL (IDs y precios en bolivianos):
${menuStr}

REGLAS CRÍTICAS — DEBES SEGUIRLAS SIN EXCEPCIÓN:

1. ORDENAR AL INSTANTE: En cuanto el cliente mencione que quiere ordenar, pedir, agregar o quiere algún producto del menú, DEBES llamar INMEDIATAMENTE a la función 'actualizar_carrito' sin pedir confirmación, sin describir los productos y sin preguntar "¿Te gustaría que...?". Simplemente ejecuta la función.

2. NUNCA describas los items en texto cuando el usuario quiere ordenar. Si detectas intención de compra, la ÚNICA respuesta válida es llamar a 'actualizar_carrito'.

3. Si el cliente pregunta sobre el menú o hace preguntas generales, responde con texto amigable, limpio y formateado en español (como viñetas de Markdown). NUNCA devuelvas código de programación, JSON crudo o arreglos de datos técnicos al usuario.

4. Si el cliente pide algo que NO está en el menú, explícalo educadamente.

5. Nunca inventes IDs, nombres o precios. Usa solo los del menú oficial.

6. OCULTAR IDS INTERNOS: NUNCA muestres los IDs de los productos al usuario en el chat (ej: no incluyas textos como "(ID: 1)" o "ID: 1"). Los IDs son exclusivamente técnicos para llamadas a funciones. Al describir el menú, solo muestra el nombre del producto, su descripción y su precio (ej: "1/4 de Pollo a la Brasa - 22.5 Bs.").

EJEMPLO CORRECTO: Si el usuario dice "quiero un cuarto de pollo", llama a actualizar_carrito con productoId del cuarto de pollo, sin escribir nada antes.`;
    } catch (err) {
      this.logger.error(
        'Error generating system instruction, using fallback menu:',
        err.message,
      );
      return 'Eres el asistente de Pollos Carmesí. Ayuda al usuario a ordenar.';
    }
  }

  private getTools() {
    const actualizarCarritoDeclaration: any = {
      name: 'actualizar_carrito',
      description:
        'Modifica o agrega productos al carrito de compras del usuario según el menú de la pollería.',
      parameters: {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            description:
              'La lista de productos que el usuario desea pedir o agregar.',
            items: {
              type: 'OBJECT',
              properties: {
                productoId: {
                  type: 'STRING',
                  description:
                    'El ID único del producto en el menú (ej. "1", "2", "3", etc.).',
                },
                cantidad: {
                  type: 'INTEGER',
                  description: 'La cantidad del producto a ordenar.',
                },
              },
              required: ['productoId', 'cantidad'],
            },
          },
        },
        required: ['items'],
      },
    };

    return [{ functionDeclarations: [actualizarCarritoDeclaration] }];
  }

  /**
   * Reintenta la llamada ante errores 503 transitorios (sobrecarga temporal).
   * Errores definitivos como cuota agotada (429) o modelo vacío NO se reintentan.
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = 2,
    delay = 1500,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const msg: string = err?.message || '';
        const isRetryable =
          msg.includes('503') || msg.includes('Service Unavailable');

        if (isRetryable && attempt < retries) {
          this.logger.warn(
            `Gemini 503 error (Attempt ${attempt}/${retries}). Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw err;
        }
      }
    }
    throw new Error('executeWithRetry exhausted all retries');
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  async procesarMensajeTexto(
    mensaje: string,
    authHeader?: string,
  ): Promise<any> {
    this.logger.log(`Procesando mensaje de texto: "${mensaje}"`);

    if (!this.genAI) {
      return this.getMockResponse(mensaje);
    }

    try {
      const instructions = await this.getSystemInstruction(authHeader);
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: instructions,
        tools: this.getTools(),
      });

      const result = await this.executeWithRetry(() =>
        model.generateContent(mensaje),
      );

      return this.parseGeminiResponse(result.response);
    } catch (err: any) {
      this.logger.error('Error calling Gemini API for text:', err.message);
      return {
        tipo: 'TEXTO',
        respuesta_ia: this.classifyGeminiError(err, false),
      };
    }
  }

  async procesarMensajeAudio(
    fileBuffer: Buffer,
    mimetype: string,
    authHeader?: string,
  ): Promise<any> {
    this.logger.log(
      `Procesando mensaje de audio con formato: ${mimetype}, tamaño: ${fileBuffer.length} bytes`,
    );

    // Rechazar audios demasiado cortos (< 2 KB = casi certeza de silencio)
    if (fileBuffer.length < 2048) {
      this.logger.warn(
        `Audio descartado por ser demasiado pequeño: ${fileBuffer.length} bytes`,
      );
      return {
        tipo: 'TEXTO',
        respuesta_ia:
          '🎙️ El audio grabado fue demasiado corto. Mantén presionado el micrófono, habla con claridad y suéltalo cuando termines.',
      };
    }

    if (!this.genAI) {
      return this.getMockResponse(
        'Quiero un cuarto de pollo y un combo familiar (simulado por voz)',
      );
    }

    try {
      const instructions = await this.getSystemInstruction(authHeader);
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: instructions,
        tools: this.getTools(),
      });

      const audioPart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimetype,
        },
      };

      const result = await this.executeWithRetry(() =>
        model.generateContent([
          audioPart,
          {
            text: 'INSTRUCCIÓN: Escucha este audio. Si el cliente tiene intención de ordenar, pedir o agregar productos al carrito, llama directamente a la función "actualizar_carrito" con los productos solicitados sin pedir confirmación. Si el cliente hace preguntas generales o pregunta qué productos hay en el menú, respóndele con texto amigable, limpio y formateado en español (nunca devuelvas JSON crudo, llaves, corchetes o código de programación al usuario).',
          },
        ]),
      );

      return this.parseGeminiResponse(result.response);
    } catch (err: any) {
      this.logger.error('Error calling Gemini API for audio:', err.message);
      return {
        tipo: 'TEXTO',
        respuesta_ia: this.classifyGeminiError(err, true),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Private parsing
  // ---------------------------------------------------------------------------

  private parseGeminiResponse(response: any): any {
    // Inspeccionar candidatos y finishReason antes de llamar .text()
    const candidates = response?.candidates;
    if (candidates && candidates.length > 0) {
      const finishReason = candidates[0]?.finishReason;
      if (
        finishReason === 'SAFETY' ||
        finishReason === 'OTHER' ||
        finishReason === 'RECITATION'
      ) {
        this.logger.warn(
          `Gemini response blocked or empty. finishReason: ${finishReason}`,
        );
        return {
          tipo: 'TEXTO',
          respuesta_ia:
            '🚫 No pude procesar esa solicitud por restricciones de contenido. Por favor intenta reformular tu mensaje.',
        };
      }
    }

    // Intentar obtener function calls primero (no requieren texto)
    let calls: any[] | null = null;
    try {
      calls =
        typeof response.functionCalls === 'function'
          ? response.functionCalls()
          : null;
    } catch {
      // No hay function calls en esta respuesta
    }

    if (calls && calls.length > 0) {
      const call = calls[0];
      if (call.name === 'actualizar_carrito') {
        const args = call.args;
        let text = '';
        try {
          text = typeof response.text === 'function' ? response.text() : '';
        } catch {
          // Sin texto acompañante
        }
        this.logger.log(
          `Function Call 'actualizar_carrito' detectado:`,
          args.items,
        );
        return {
          tipo: 'ACCION_CARRITO',
          items: args.items,
          respuesta_ia:
            text || 'Perfecto. Ya agregué los productos a tu carrito. 🛒',
        };
      }
    }

    // Intentar extraer la respuesta de texto
    let text = '';
    try {
      text = typeof response.text === 'function' ? response.text() : '';
    } catch (err: any) {
      this.logger.warn(
        `Could not extract text from Gemini response: ${err.message}`,
      );
    }

    return {
      tipo: 'TEXTO',
      respuesta_ia:
        text ||
        '¿En qué más te puedo ayudar hoy con tu pedido de Pollos Carmesí?',
    };
  }

  // ---------------------------------------------------------------------------
  // Simulación (sin API Key)
  // ---------------------------------------------------------------------------

  private getMockResponse(input: string): any {
    const clean = input.toLowerCase();
    this.logger.log(
      'Gemini API key not found, returning mock response for:',
      input,
    );

    if (
      clean.includes('pollo') ||
      clean.includes('combo') ||
      clean.includes('gaseosa') ||
      clean.includes('quiero') ||
      clean.includes('pedir')
    ) {
      const items: any[] = [];
      let respuesta_ia = '¡Claro que sí! He añadido a tu carrito: ';

      if (
        clean.includes('cuarto') ||
        clean.includes('1/4') ||
        clean.includes('uno')
      ) {
        items.push({ productoId: '1', cantidad: 1 });
        respuesta_ia += '1x Cuarto de Pollo. ';
      } else if (clean.includes('combo') || clean.includes('familiar')) {
        items.push({ productoId: '4', cantidad: 1 });
        respuesta_ia += '1x Combo Familiar Carmesí. ';
      } else {
        items.push({ productoId: '3', cantidad: 1 });
        respuesta_ia += '1x Pollo Entero. ';
      }

      respuesta_ia += '¿Deseas completar tu orden o agregar alguna gaseosa?';
      return {
        tipo: 'ACCION_CARRITO',
        items,
        respuesta_ia,
      };
    }

    return {
      tipo: 'TEXTO',
      respuesta_ia:
        'Hola, soy el asistente virtual de Pollos Carmesí. (Modo simulación activo - GEMINI_API_KEY vacía). Puedes pedirme que agregue cosas al carrito, como "quiero un combo familiar".',
    };
  }
}
