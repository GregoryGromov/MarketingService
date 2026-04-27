import { TypeID, typeid } from 'typeid-js';

// TypeID — time-sortable, type-prefixed identifiers
// Usage: generateId('article') -> 'article_01j5k...'
// Storage: text column in PostgreSQL

export type TypedId<TPrefix extends string> = `${TPrefix}_${string}`;

export function generateId<TPrefix extends string>(prefix: TPrefix): TypedId<TPrefix> {
  return typeid(prefix).toString() as TypedId<TPrefix>;
}

export function parseId<TPrefix extends string>(
  value: string,
  prefix: TPrefix,
): TypedId<TPrefix> {
  return TypeID.fromString(value, prefix).toString() as TypedId<TPrefix>;
}

export function isIdOfType<TPrefix extends string>(
  value: string,
  prefix: TPrefix,
): value is TypedId<TPrefix> {
  try {
    TypeID.fromString(value, prefix);
    return true;
  } catch {
    return false;
  }
}
