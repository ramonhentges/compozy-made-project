import { IDatabase } from 'pg-promise';
import { IUserRepository } from '../../../domain/repository/user_repository';
import { User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value_objects/email';
import { UserId } from '../../../domain/value_objects/user_id';
import { UserMapper, UserDTO } from '../mappers/user_mapper';

export class UserRepository implements IUserRepository {
  private readonly db: IDatabase<object>;

  constructor(db: IDatabase<object>) {
    this.db = db;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db.oneOrNone<UserDTO>(
      `SELECT id, email, password_hash, created_at, updated_at 
       FROM users 
       WHERE email = $1`,
      [email.value]
    );
    if (!row) {
      return null;
    }
    return UserMapper.toDomain(row);
  }

  async findById(userId: UserId): Promise<User | null> {
    const row = await this.db.oneOrNone<UserDTO>(
      `SELECT id, email, password_hash, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [userId.value]
    );
    if (!row) {
      return null;
    }
    return UserMapper.toDomain(row);
  }

  async save(user: User): Promise<void> {
    const dto = UserMapper.toDTO(user);
    await this.db.none(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [dto.id, dto.email, dto.password_hash, dto.created_at, dto.updated_at]
    );
  }

  async update(user: User): Promise<void> {
    const dto = UserMapper.toDTO(user);
    await this.db.none(
      `UPDATE users 
       SET email = $2, password_hash = $3, updated_at = $4 
       WHERE id = $1`,
      [dto.id, dto.email, dto.password_hash, dto.updated_at]
    );
  }

  async delete(userId: UserId): Promise<void> {
    await this.db.none(
      `DELETE FROM users WHERE id = $1`,
      [userId.value]
    );
  }
}
