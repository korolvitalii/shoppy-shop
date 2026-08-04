export interface UserDto {
  id: string;
  email: string;
  displayName: string | null;
  roles: readonly string[];
}

export interface AuthResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string | null;
}
