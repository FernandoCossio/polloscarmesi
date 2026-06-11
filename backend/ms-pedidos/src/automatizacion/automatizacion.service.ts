import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { Ms1GraphqlClient } from '../graphql/client/ms1-graphql.client';
import { S3Service } from '../infrastructure/s3/s3.service';
import { DynamoDbService } from '../infrastructure/dynamodb/dynamodb.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class AutomatizacionService {
  private readonly logger = new Logger(AutomatizacionService.name);

  constructor(
    @InjectRepository(PedidoDelivery)
    private readonly pedidoRepo: Repository<PedidoDelivery>,
    private readonly ms1Client: Ms1GraphqlClient,
    private readonly s3Service: S3Service,
    private readonly dynamoDbService: DynamoDbService,
  ) {}

  async realizarCierreCaja(fecha?: string): Promise<{ url: string; consolidado: any }> {
    const targetDate = fecha || new Date().toISOString().slice(0, 10);
    this.logger.log(`Iniciando cierre de caja para la fecha: ${targetDate}`);

    const ms1Pedidos = await this.ms1Client.obtenerPedidosPorFecha(targetDate);
    const ms1Presenciales = ms1Pedidos.filter((p) => p.tipo === 'PRESENCIAL' && p.estado === 'ENTREGADO');
    const totalMs1Ventas = ms1Presenciales.reduce((sum, p) => sum + Number(p.total), 0);

    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

    const ms2Pedidos = await this.pedidoRepo.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const entregados = ms2Pedidos.filter((p) => p.estado === EstadoDelivery.ENTREGADO);
    const cancelados = ms2Pedidos.filter((p) => p.estado === EstadoDelivery.CANCELADO);
    const totalMs2Ventas = entregados.reduce((sum, p) => sum + Number(p.total), 0);

    const consolidado = {
      fecha: targetDate,
      ms1: {
        totalPedidos: ms1Pedidos.length,
        entregados: ms1Presenciales.length,
        totalVentas: totalMs1Ventas,
      },
      ms2: {
        totalPedidos: ms2Pedidos.length,
        entregados: entregados.length,
        cancelados: cancelados.length,
        totalVentas: totalMs2Ventas,
      },
      totalGlobal: totalMs1Ventas + totalMs2Ventas,
    };

    const pdfBuffer = await this.generateReportPdf(consolidado);

    const timestamp = Date.now();
    const s3Key = `cierres/cierre-${targetDate}-${timestamp}.pdf`;
    const reportUrl = await this.s3Service.uploadFile(pdfBuffer, s3Key, 'application/pdf');

    await this.dynamoDbService.logEvent(targetDate, 'CIERRE_CAJA', {
      fecha: targetDate,
      totalGlobal: consolidado.totalGlobal,
      reportUrl,
      s3Key,
    });

    return { url: reportUrl, consolidado };
  }

  private async generateReportPdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(22).fillColor('#B22222').text('POLLOS CARMESÍ', { align: 'center' });
      doc.fontSize(14).fillColor('#3E2723').text('Reporte Consolidado de Cierre de Caja', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(10).fillColor('#757575').text(`Fecha del Cierre: ${data.fecha}`);
      doc.text(`Generado el: ${new Date().toLocaleString()}`);
      doc.moveDown();
      doc.strokeColor('#EEEEEE').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).fillColor('#B22222').text('Ventas Presenciales (MS1)', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#3E2723').text(`Pedidos Totales: ${data.ms1.totalPedidos}`);
      doc.text(`Pedidos Entregados (Cobrados): ${data.ms1.entregados}`);
      doc.fontSize(12).text(`Total Recaudado Presencial: ${data.ms1.totalVentas.toFixed(2)} Bs.`);
      doc.moveDown(1.5);

      doc.fontSize(14).fillColor('#B22222').text('Ventas Delivery (MS2)', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#3E2723').text(`Pedidos Totales: ${data.ms2.totalPedidos}`);
      doc.text(`Entregas Completadas: ${data.ms2.entregados}`);
      doc.text(`Pedidos Cancelados: ${data.ms2.cancelados}`);
      doc.fontSize(12).text(`Total Recaudado Delivery: ${data.ms2.totalVentas.toFixed(2)} Bs.`);
      doc.moveDown(1.5);

      doc.strokeColor('#EEEEEE').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#B22222').text(`TOTAL CONSOLIDADO DEL DÍA: ${data.totalGlobal.toFixed(2)} Bs.`, { align: 'right' });

      doc.end();
    });
  }
}
