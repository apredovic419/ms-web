import {gameDB} from "./connection";
import {eq} from "drizzle-orm";
import {accounts} from "./schema";
import bcrypt from 'bcryptjs';


export type SelectAccount = typeof accounts.$inferSelect;


/** Get all accounts
 */
export async function getAllAccounts(): Promise<SelectAccount[]> {
  return gameDB.select().from(accounts);
}

export async function editAccountById(id: number, data: Partial<SelectAccount>) {
  await gameDB.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function createAccount(data: Partial<SelectAccount>): Promise<SelectAccount> {
  const now = new Date();
  const defaultValues: Omit<SelectAccount, 'id' | 'name' | 'password' | 'email' | 'birthday'> = {
    pin: '',
    pic: '',
    loggedin: 0,
    lastlogin: null,
    createdat: now,
    banned: 0,
    banreason: null,
    macs: null,
    nxCredit: 0,
    maplePoint: 0,
    nxPrepaid: 0,
    characterslots: 3,
    gender: 0,
    tempban: new Date(2018, 6, 19, 16, 0, 0),
    greason: 0,
    tos: 0,
    sitelogged: null,
    webadmin: 0,
    nick: null,
    mute: 0,
    ip: null,
    rewardpoints: 0,
    votepoints: 0,
    hwid: '',
    language: 2,
  };

  const insertData = {
    ...defaultValues,
    ...data,
    createdat: now
  }

  const result = await gameDB.insert(accounts).values(insertData);
  const {insertId} = result[0];
  const account = await gameDB.select().from(accounts).where(eq(accounts.id, insertId));
  return account[0];
}

export async function verifyAccount(username: string, password: string): Promise<SelectAccount | null> {
  const account = await gameDB.select().from(accounts).where(eq(accounts.name, username)).limit(1);

  if (!account || account.length === 0) {
    return null;
  }

  const user = account[0];

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  if (user.webadmin === null || user.webadmin < 1) {
    return null;
  }

  return user;
}