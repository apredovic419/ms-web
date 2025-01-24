import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
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
    const {id} = await props.params;
    const data = await request.json();
    const password = data.password as string;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    await editAccountById(id, {password: hashedPassword});
    return NextResponse.json(
      {message: 'success'},
      {status: 200}
    );
  } catch (error) {
    return NextResponse.json(
      {message: 'Error processing request'},
      {status: 500}
    );
  }
}
