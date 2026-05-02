import { RefreshToken } from '../../../domain/entities/refresh_token';
import { RefreshTokenId } from '../../../domain/value_objects/refresh_token_id';
import { UserId } from '../../../domain/value_objects/user_id';

export interface RefreshTokenDTO {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  device_info: string | null;
  last_used_at: Date | null;
}

export class RefreshTokenMapper {
  static toDomain(dto: RefreshTokenDTO): RefreshToken {
    const refreshTokenId = new RefreshTokenId(dto.id);
    const userId = new UserId(dto.user_id);
    return new RefreshToken(
      refreshTokenId,
      userId,
      dto.token_hash,
      dto.expires_at,
      dto.created_at,
      dto.revoked_at ?? null,
      dto.device_info ?? null,
      dto.last_used_at ?? null
    );
  }

  static toDTO(refreshToken: RefreshToken): RefreshTokenDTO {
    return {
      id: refreshToken.getId().value,
      user_id: refreshToken.userId.value,
      token_hash: refreshToken.tokenHash,
      expires_at: refreshToken.expiresAt,
      created_at: refreshToken.createdAt,
      revoked_at: refreshToken.revokedAt,
      device_info: refreshToken.deviceInfo,
      last_used_at: refreshToken.lastUsedAt,
    };
  }
}
