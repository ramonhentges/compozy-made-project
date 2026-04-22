export interface RegisterUserCommand {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
}