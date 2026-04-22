import { User } from '../../../domain/entities/user';
import { UserId } from '../../../domain/value_objects/user_id';
import { Email } from '../../../domain/value_objects/email';
import { Password } from '../../../domain/value_objects/password';

export interface UserDTO {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    const userId = new UserId(dto.id);
    const email = new Email(dto.email);
    const password = new Password(dto.password_hash);
    return new User(userId, email, password, dto.created_at, dto.updated_at);
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.getId().value,
      email: user.email.value,
      password_hash: user.password.hash,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
