import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard opcional de JWT que no lanza error si no hay token
 * Útil para endpoints públicos que pueden funcionar con o sin autenticación
 * 
 * SEGURIDAD:
 * - Si no hay token → permite continuar (registro público)
 * - Si el token es inválido o manipulado → Passport lo rechaza y retorna undefined
 * - Si el token es válido → retorna el usuario real de la BD
 * - La validación de roles se hace en el servicio, no en el guard
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization?.replace('Bearer ', '');
    
    // Si no hay token, permitir continuar (registro público)
    if (!token) {
      return true;
    }
    
    // Si hay token, intentar validarlo
    const result = super.canActivate(context);
    
    if (result instanceof Promise) {
      return result.catch((error) => {
        // Si el token es inválido, manipulado o expirado, Passport lo rechaza
        // Permitir continuar pero sin usuario (será tratado como registro público)
        this.logger.warn(`⚠️ Token inválido o expirado en endpoint opcional: ${error?.message || 'Unknown error'}`);
        return true;
      });
    }
    
    return result;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Si hay error de autenticación (token inválido, expirado, etc.)
    if (err) {
      this.logger.warn(`⚠️ Error de autenticación en endpoint opcional: ${err.message || 'Unknown error'}`);
      return undefined;
    }
    
    // Si no hay usuario (token no válido o no existe)
    if (!user) {
      return undefined;
    }
    
    // Token válido: retornar usuario real de la BD (ya validado por JwtStrategy)
    return user;
  }
}
