import { IDatabase, ITask } from 'pg-promise';
import { IUserRepository } from '../../../domain/repository/user_repository';
import { User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value_objects/email';
import { UserId } from '../../../domain/value_objects/user_id';
import { UserMapper, UserDTO } from '../mappers/user_mapper';
import { OutboxEventMapper } from '../mappers/outbox_event_mapper';
import {
  INSERT_OUTBOX_EVENT_SQL,
  toOutboxInsertParams,
  buildBatchInsertSQL,
  toBatchOutboxInsertParams,
} from '../sql/outbox_sql';

export class UserRepository implements IUserRepository {
  private readonly db: IDatabase<object>;

  constructor(db: IDatabase<object>) {
    this.db = db;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db.oneOrNone<UserDTO>(
      `SELECT id, email, name, password_hash, created_at, updated_at 
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
      `SELECT id, email, name, password_hash, created_at, updated_at 
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
    const domainEvents = user.pullDomainEvents();

    await this.db.tx(async (transaction) => {
      await transaction.none(
        `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [dto.id, dto.email, dto.name, dto.password_hash, dto.created_at, dto.updated_at]
      );
      await this.insertOutboxEvents(transaction, domainEvents);
    });
  }

  async update(user: User): Promise<void> {
    const dto = UserMapper.toDTO(user);
    const domainEvents = user.pullDomainEvents();

    await this.db.tx(async (transaction) => {
      await transaction.none(
        `UPDATE users 
         SET email = $2, name = $3, password_hash = $4, updated_at = $5 
         WHERE id = $1`,
        [dto.id, dto.email, dto.name, dto.password_hash, dto.updated_at]
      );
      await this.insertOutboxEvents(transaction, domainEvents);
    });
  }

  async delete(userId: UserId): Promise<void> {
    await this.db.tx(async (transaction) => {
      await transaction.none(
        `DELETE FROM users WHERE id = $1`,
        [userId.value]
      );
    });
  }

  private async insertOutboxEvents(
    transaction: ITask<object>,
    domainEvents: ReturnType<User['pullDomainEvents']>
  ): Promise<void> {
    if (domainEvents.length === 0) {
      return;
    }
    const outboxRecords = domainEvents.map((event) => OutboxEventMapper.toInsertData(event));
    const sql = buildBatchInsertSQL(outboxRecords);
    const params = toBatchOutboxInsertParams(outboxRecords);
    await transaction.none(sql, params);
  }
}
