export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
}