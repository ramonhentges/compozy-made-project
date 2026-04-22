import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { OUTBOX_INSERT_COLUMNS } from './outbox_sql';

describe('outbox SQL helper integration', () => {
  it('keeps insert columns ordered consistently with the outbox migration table columns', () => {
    const migrationPath = resolve(
      __dirname,
      '../../../../../migrations/identity_context/20260421195800_outbox_events.sql'
    );
    const migrationSql = readFileSync(migrationPath, 'utf8');

    const tableColumnOrder = [
      'id',
      'event_name',
      'event_version',
      'aggregate_type',
      'aggregate_id',
      'payload',
      'status',
      'attempts',
      'next_attempt_at',
      'last_error',
      'occurred_on',
      'created_at',
      'processing_started_at',
      'published_at',
    ];

    const columnPositions = tableColumnOrder.map((columnName) => ({
      columnName,
      position: migrationSql.indexOf(`    ${columnName} `),
    }));

    expect(columnPositions.every(({ position }) => position >= 0)).toBe(true);
    expect(columnPositions.map(({ position }) => position)).toEqual(
      [...columnPositions.map(({ position }) => position)].sort((left, right) => left - right)
    );
    expect(OUTBOX_INSERT_COLUMNS).toEqual(tableColumnOrder);
  });
});

