import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType<any>();

    if (contextType === 'http') {
      const httpCtx = context.switchToHttp();
      const req = httpCtx.getRequest();
      
      const operationName = `${req.method} ${req.url}`;
      const ip = req.ip;

      return next.handle().pipe(
        tap({
          next: () => {
            this.safeLog({
              timestamp: new Date(),
              userId: req.user?.userId,
              role: req.user?.role,
              operationName,
              operationType: 'rest',
              statusCode: 200,
              ip,
              eventType: 'rest_operation',
            });
          },
          error: (error) => {
            this.safeLog({
              timestamp: new Date(),
              userId: req.user?.userId,
              role: req.user?.role,
              operationName,
              operationType: 'rest',
              statusCode: error.status || 500,
              ip,
              eventType: 'rest_error',
            });
          },
        }),
      );
    }

    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      const req = gqlCtx.getContext().req;
      const user = req.user;

      const operationName = info.fieldName;
      const operationType = info.operation?.operation || 'unknown'; 
      const ip = req?.ip;

      return next.handle().pipe(
        tap({
          next: () => {
            this.safeLog({
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
            this.safeLog({
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

    return next.handle();
  }

  private safeLog(event: AuditEvent) {
    try {
      void this.auditService.logAuditEvent(event).catch(() => undefined);
    } catch {
      return;
    }
  }
}

type AuditEvent = Parameters<AuditService['logAuditEvent']>[0];
