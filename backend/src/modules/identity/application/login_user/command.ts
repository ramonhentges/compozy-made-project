export interface LoginUserCommand {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
}

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}