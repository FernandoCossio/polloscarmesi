export const GATEWAY_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export interface TokenResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

function decodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let buffer = '';
  const cleanStr = str.replace(/=+$/, '');
  for (let i = 0, bc = 0, bs = 0; i < cleanStr.length; i++) {
    const char = cleanStr.charAt(i);
    const idx = chars.indexOf(char);
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      buffer += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return buffer;
}

export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1];
    const decoded = decodeBase64(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

let authToken: string | null = null;

export const AuthService = {
  setToken(token: string | null) {
    authToken = token;
  },

  getToken(): string | null {
    return authToken;
  },

  async login(username: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Error al iniciar sesión');
    }
    const apiResponse = json as ApiResponse<TokenResponse>;
    
    this.setToken(apiResponse.data.accessToken);
    
    return apiResponse.data;
  }
};
