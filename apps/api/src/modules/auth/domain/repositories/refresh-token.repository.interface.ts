export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');

export interface IRefreshTokenRepository {
  create(data: { tokenHash: string; userId: string; expiresAt: Date }): Promise<void>;
  findByHash(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
  deleteById(id: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
