import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {createAccount} from "@/lib/db/account";
import {mustAuth} from "app/api/utils";


export async function POST(request: Request): Promise<Response> {
  const response = await mustAuth();
  if (response) {
    return response;
  }

  try {
    const data = await request.json();
    const salt = await bcrypt.genSalt(12);
    data.password = await bcrypt.hash(data.password, salt);
    const account = await createAccount({
      ...data,
      birthday: new Date(data.birthday),
    });
    return NextResponse.json(
      {message: 'success', data: account},
      {status: 200}
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        {message: 'Username already exists'},
        {status: 400}
      );
    }
    return NextResponse.json(
      {message: 'Error processing request'},
      {status: 500}
    );
  }
}
