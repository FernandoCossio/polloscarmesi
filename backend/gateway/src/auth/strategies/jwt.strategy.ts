import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // username
  roles: string[]; // e.g., ["ROLE_ADMIN"]
  iss: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ms4.jwtPublicKey') || '',
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    // Extract role without ROLE_ prefix if present
    let role = 'USER'; // Default
    if (payload.roles && payload.roles.length > 0) {
      // Take first role and remove ROLE_ prefix
      role = payload.roles[0].replace('ROLE_', '');
    }
    
    return { 
      userId: payload.sub, // username is the subject
      role: role 
    };
  }
}
