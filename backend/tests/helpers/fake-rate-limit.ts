import { vi } from "vitest";

/**
 * In-memory stand-in for prisma.rateLimitHit, so tests can exercise the real
 * limiter logic without a database.
 */
export function fakeRateLimitHit() {
  let rows: Array<{ key: string; createdAt: Date }> = [];

  const matches = (row: { key: string; createdAt: Date }, where: any = {}) => {
    if (where.key !== undefined && row.key !== where.key) return false;
    if (where.createdAt?.gte && row.createdAt < where.createdAt.gte) return false;
    if (where.createdAt?.lt && !(row.createdAt < where.createdAt.lt)) return false;
    return true;
  };

  return {
    count: vi.fn(async ({ where }: any) => rows.filter((r) => matches(r, where)).length),
    create: vi.fn(async ({ data }: any) => {
      const row = { key: data.key, createdAt: data.createdAt ?? new Date() };
      rows.push(row);
      return row;
    }),
    deleteMany: vi.fn(async ({ where }: any) => {
      const before = rows.length;
      rows = rows.filter((r) => !matches(r, where));
      return { count: before - rows.length };
    }),
    /** Test helper: forget everything. */
    reset: () => {
      rows = [];
    },
  };
}
