import {accounts, characters, guilds, inventoryitems} from './schema';
import {and, eq, type InferSelectModel, like, SQL,} from 'drizzle-orm';
import {gameDB as db} from "@/lib/db/connection";

export type SelectCharacter = typeof characters.$inferSelect;


export type CharacterWithRelations = InferSelectModel<typeof characters> & {
  account?: InferSelectModel<typeof accounts> | null;
  guild?: InferSelectModel<typeof guilds> | null;
  items?: InferSelectModel<typeof inventoryitems>[];
};

type Filter<T> = {
  [K in keyof T]?: T[K] | T[K][];
};


type FindManyConfig = {
  filter?: Filter<InferSelectModel<typeof characters>>;
  limit?: number;
  offset?: number;
  with?: {
    account?: boolean;
    guild?: boolean;
    items?: boolean;
  };
};


export async function findCharactersWithRelations(
  config?: FindManyConfig
): Promise<CharacterWithRelations[]> {
  const {filter, limit, offset, with: withOption} = config || {};
  let whereClause: SQL<unknown> | undefined = undefined;
  const filters: SQL<unknown>[] = [];

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'name') {
        const v = `%${value}%`;
        filters.push(like(characters.name, v));
      } else if (key === 'accountId') {
        filters.push(eq(characters.accountId, Number(value)));
      }
    }
    whereClause = filters.length > 0 ? and(...filters) : undefined;
  }

  const result = await db.query.characters.findMany({
    where: whereClause,
    with: {
      ...(withOption?.account === true ? {account: true} : {}),
      ...(withOption?.guild === true ? {guild: true} : {}),
      ...(withOption?.items === true ? {items: true} : {}),
    },
    limit: limit,
    offset: offset
  });

  return result.map(row => ({
      ...row,
      account: row.account ? row.account : null,
      guild: row.guild ? row.guild : null,
      items: row.items ? row.items : []
    })
  );
}