export const MAX_PAGES_PER_RESOURCE = 100;

export async function collectCursorPages<T>(options: {
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>;
  maxPages?: number;
}): Promise<T[]> {
  const items: T[] = [];
  const maxPages = options.maxPages ?? MAX_PAGES_PER_RESOURCE;
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await options.fetchPage(cursor);
    items.push(...result.items);

    if (!result.nextCursor) {
      return items;
    }

    if (seenCursors.has(result.nextCursor)) {
      return items;
    }

    seenCursors.add(result.nextCursor);
    cursor = result.nextCursor;
  }

  return items;
}
