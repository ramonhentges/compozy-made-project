export interface RegisterUserCommand {
  email: string;
  name: string;
  password: string;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
  name: string;
}