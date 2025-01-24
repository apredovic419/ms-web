import {NextResponse} from 'next/server';
import {editAccountById} from "@/lib/db/account";
import {mustAuth} from "app/api/utils";

export async function POST(request: Request, props: {
  params: Promise<{ id: number }>
}): Promise<Response> {
  const response = await mustAuth();
  if (response) {
    return response;
  }

  try {
    const data = await request.json();
    const params = await props.params;
    const id = params.id;
    const action = data.action as string;
    
    if (action === 'grant') {
      await editAccountById(id, {webadmin: 1});
    } else if (action === 'revoke') {
      await editAccountById(id, {webadmin: 0});
    } else {
      return NextResponse.json(
        {message: 'Invalid action'},
        {status: 400}
      );
    }
    
    return NextResponse.json(
      {message: 'success', data},
      {status: 200}
    );
  } catch (error) {
    console.error('Error updating webadmin status:', error);
    return NextResponse.json(
      {message: 'Error processing request'},
      {status: 500}
    );
  }
} 