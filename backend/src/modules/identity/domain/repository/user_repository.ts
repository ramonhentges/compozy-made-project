import { Email } from '../value_objects/email';
import { User } from '../entities/user';
import { UserId } from '../value_objects/user_id';

export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(userId: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(userId: UserId): Promise<void>;
}
