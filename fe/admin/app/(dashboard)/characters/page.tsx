import * as React from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {DataTable} from "./data-table";
import {findCharactersWithRelations} from "@/lib/db/character";
import {Suspense} from "react";
import {SearchInput} from "./search";


export default async function CharactersPage(props: {
  searchParams: Promise<{ name?: string; accountId?: number, offset?: number }>;
}) {
  const searchParams = await props.searchParams;
  const characters = await findCharactersWithRelations({
    filter: {
      ...(searchParams.name && {name: searchParams.name}),
      ...(searchParams.accountId && {accountId: searchParams.accountId}),
    },
    with: {account: true, guild: true, items: true},
    limit: 10,
    offset: Number.parseInt(String(searchParams.offset || 0)),
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Card>
        <CardHeader>
          <CardTitle>Characters</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading table...</div>}>
            <DataTable characters={characters}
                     nextOffset={Number.parseInt(String(searchParams.offset || 0)) + 10}/>
          </Suspense>
        </CardContent>
      </Card>
    </Suspense>
  );
}
