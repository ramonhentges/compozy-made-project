import { IDatabase, ITask } from 'pg-promise';
import { IRefreshTokenRepository } from '../../../domain/repository/refresh_token_repository';
import { RefreshToken } from '../../../domain/entities/refresh_token';
import { RefreshTokenId } from '../../../domain/value_objects/refresh_token_id';
import { UserId } from '../../../domain/value_objects/user_id';
import { RefreshTokenMapper, RefreshTokenDTO } from '../mappers/refresh_token_mapper';
import { OutboxEventMapper } from '../mappers/outbox_event_mapper';
import {
  buildBatchInsertSQL,
  toBatchOutboxInsertParams,
} from '../sql/outbox_sql';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly db: IDatabase<object>;

  constructor(db: IDatabase<object>) {
    this.db = db;
  }

  async findById(id: RefreshTokenId): Promise<RefreshToken | null> {
    const row = await this.db.oneOrNone<RefreshTokenDTO>(
      `SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, device_info, last_used_at
       FROM refresh_tokens
       WHERE id = $1`,
      [id.value]
    );
    if (!row) {
      return null;
    }
    return RefreshTokenMapper.toDomain(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.db.oneOrNone<RefreshTokenDTO>(
      `SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, device_info, last_used_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    if (!row) {
      return null;
    }
    return RefreshTokenMapper.toDomain(row);
  }

  async findActiveByUserId(userId: UserId): Promise<RefreshToken | null> {
    const row = await this.db.oneOrNone<RefreshTokenDTO>(
      `SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, device_info, last_used_at
       FROM refresh_tokens
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId.value]
    );
    if (!row) {
      return null;
    }
    return RefreshTokenMapper.toDomain(row);
  }

  async findAllActiveByUserId(userId: UserId): Promise<RefreshToken[]> {
    const rows = await this.db.manyOrNone<RefreshTokenDTO>(
      `SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, device_info, last_used_at
       FROM refresh_tokens
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
      [userId.value]
    );
    return rows.map((row) => RefreshTokenMapper.toDomain(row));
  }

  async countActiveByUserId(userId: UserId): Promise<number> {
    const result = await this.db.one<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM refresh_tokens
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
      [userId.value]
    );
    return parseInt(result.count, 10);
  }

  async revokeOldestForUser(userId: UserId, limit: number): Promise<void> {
    await this.db.none(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE id IN (
         SELECT id FROM refresh_tokens
         WHERE user_id = $1
           AND revoked_at IS NULL
           AND expires_at > NOW()
         ORDER BY created_at DESC
         OFFSET $2
       )`,
      [userId.value, limit]
    );
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    const dto = RefreshTokenMapper.toDTO(refreshToken);
    const domainEvents = refreshToken.pullDomainEvents();

    await this.db.tx(async (transaction) => {
      await transaction.none(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at, device_info, last_used_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [dto.id, dto.user_id, dto.token_hash, dto.expires_at, dto.created_at, dto.revoked_at, dto.device_info, dto.last_used_at]
      );
      await this.insertOutboxEvents(transaction, domainEvents);
    });
  }

  async update(refreshToken: RefreshToken): Promise<void> {
    const dto = RefreshTokenMapper.toDTO(refreshToken);
    const domainEvents = refreshToken.pullDomainEvents();

    await this.db.tx(async (transaction) => {
      await transaction.none(
        `UPDATE refresh_tokens
         SET token_hash = $2, expires_at = $3, revoked_at = $4, device_info = $5, last_used_at = $6
         WHERE id = $1`,
        [dto.id, dto.token_hash, dto.expires_at, dto.revoked_at, dto.device_info, dto.last_used_at]
      );
      await this.insertOutboxEvents(transaction, domainEvents);
    });
  }

  async updateLastUsedAt(id: RefreshTokenId): Promise<void> {
    await this.db.none(
      `UPDATE refresh_tokens
       SET last_used_at = NOW()
       WHERE id = $1`,
      [id.value]
    );
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    await this.db.none(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE user_id = $1
         AND revoked_at IS NULL`,
      [userId.value]
    );
  }

  async deleteAllByUserId(userId: UserId): Promise<void> {
    await this.db.none(
      `DELETE FROM refresh_tokens
       WHERE user_id = $1`,
      [userId.value]
    );
  }

  private async insertOutboxEvents(
    transaction: ITask<object>,
    domainEvents: ReturnType<RefreshToken['pullDomainEvents']>
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
