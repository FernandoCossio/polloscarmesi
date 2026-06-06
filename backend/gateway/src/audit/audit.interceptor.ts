import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const req = ctx.getContext().req;
    const user = req.user;

    const startTime = Date.now();
    const operationName = info.fieldName;
    const operationType = info.operation.operation;
    const ip = req.ip;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.logAuditEvent({
            timestamp: new Date(),
            userId: user?.userId,
            role: user?.role,
            operationName,
            operationType,
            statusCode: 200,
            ip,
            eventType: 'graphql_operation',
          });
        },
        error: (error) => {
          this.auditService.logAuditEvent({
            timestamp: new Date(),
            userId: user?.userId,
            role: user?.role,
            operationName,
            operationType,
            statusCode: error.status || 500,
            ip,
            eventType: 'graphql_error',
          });
        },
      }),
    );
  }
}
