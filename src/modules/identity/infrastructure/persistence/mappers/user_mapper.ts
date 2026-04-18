import { User } from '../../../domain/entities/user';
import { UserId } from '../../../domain/value_objects/user_id';
import { Email } from '../../../domain/value_objects/email';

export interface UserDTO {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    const userId = UserId.create(dto.id);
    const email = Email.create(dto.email);
    return User.create(userId, email, dto.password_hash);
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
