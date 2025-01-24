import * as React from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {DataTable} from "./data-table";
import {getAllAccounts, SelectAccount} from '@/lib/db/account';

export default async function UsersPage() {
  const data: SelectAccount[] = await getAllAccounts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>View all users and their information.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable accounts={data}/>
      </CardContent>
    </Card>
  );
}
