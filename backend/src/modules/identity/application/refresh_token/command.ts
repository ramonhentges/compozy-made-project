export interface RefreshTokenCommand {
  refreshToken: string;
  deviceInfo?: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
