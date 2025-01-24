import {
  bigint,
  date,
  datetime,
  int,
  json,
  mysqlTable,
  serial,
  smallint,
  text,
  timestamp,
  tinyint,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";
import {relations} from "drizzle-orm";

export const accounts = mysqlTable('accounts', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', {length: 13}).default('').notNull(),
  password: varchar('password', {length: 128}).default('').notNull(),
  pin: varchar('pin', {length: 10}).default('').notNull(),
  pic: varchar('pic', {length: 26}).default('').notNull(),
  loggedin: tinyint('loggedin').default(0).notNull(),
  lastlogin: timestamp('lastlogin'),
  createdat: timestamp('createdat').notNull(),
  birthday: date('birthday').default(new Date(2024, 6, 20)).notNull(),
  banned: tinyint('banned').default(0).notNull(),
  banreason: text('banreason'),
  macs: text('macs'),
  nxCredit: int('nxCredit').default(0),
  maplePoint: int('maplePoint').default(0),
  nxPrepaid: int('nxPrepaid').default(0),
  characterslots: tinyint('characterslots').default(3).notNull(),
  gender: tinyint('gender').default(0).notNull(),
  tempban: timestamp('tempban').default(new Date(2018, 6, 19, 16, 0, 0)).notNull(),
  greason: tinyint('greason').default(0).notNull(),
  tos: tinyint('tos').default(0).notNull(),
  sitelogged: text('sitelogged'),
  webadmin: int('webadmin').default(0),
  nick: varchar('nick', {length: 20}),
  mute: int('mute').default(0),
  email: varchar('email', {length: 45}),
  ip: text('ip'),
  rewardpoints: int('rewardpoints').default(0).notNull(),
  votepoints: int('votepoints').default(0).notNull(),
  hwid: varchar('hwid', {length: 12}).default('').notNull(),
  language: int('language').default(2).notNull(),
});

export const cashshop = mysqlTable('cashshop', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', {length: 16}).notNull(),
  desc: varchar('desc', {length: 64}),
  categoryId: varchar('category', {length: 32}),
  itemId: int('itemId').notNull(),
  itemIco: varchar('itemIco', {length: 255}),
  count: int('count').default(1).notNull(),
  price: int('price').notNull(),
  currency: varchar('currency', {length: 12}).default('点券').notNull(),
  display: tinyint('display').default(1).notNull(),
  canBuy: tinyint('canBuy').default(1).notNull(),
  receiveMethod: smallint('receiveMethod').default(0).notNull(),
  banGift: tinyint('banGift').default(0).notNull(),
  createTime: datetime('create_time').notNull(),
  saleStartTime: datetime('start_sale_time'),
  saleEndTime: datetime('end_sale_time'),
  stock: int('amount'),
  rank: int('rank').default(0).notNull(),
  limitGroup: varchar('limit_group', {length: 64}),
  userLimit: int('user_limit'),
  charLimit: int('char_limit'),
  expiration: int('expiration'),
  extend: text('extend')
});


export const shopCategory = mysqlTable('itemtype', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', {length: 32}).notNull(),
  display: boolean('display').default(false).notNull(),
})


export const characters = mysqlTable(
  "characters",
  {
    id: int("id").autoincrement().primaryKey(),
    accountId: int('accountid').notNull().default(0),
    world: int('world').notNull().default(0),
    name: varchar('name', {length: 13}).notNull().default(''),
    level: int('level').notNull().default(1),
    exp: int('exp').notNull().default(0),
    gachaExp: int('gachaexp').notNull().default(0),
    str: int('str').notNull().default(12),
    dex: int('dex').notNull().default(5),
    luk: int('luk').notNull().default(4),
    int: int('int').notNull().default(4),
    hp: int('hp').notNull().default(50),
    mp: int('mp').notNull().default(5),
    maxHp: int('maxhp').notNull().default(50),
    maxMp: int('maxmp').notNull().default(5),
    meso: int('meso').notNull().default(0),
    hpMpUsed: int('hpMpUsed').notNull().default(0),
    job: int('job').notNull().default(0),
    skinColor: int('skincolor').notNull().default(0),
    gender: int('gender').notNull().default(0),
    fame: int('fame').notNull().default(0),
    fQuest: int('fquest').notNull().default(0),
    hair: int('hair').notNull().default(0),
    face: int('face').notNull().default(0),
    ap: int('ap').notNull().default(0),
    sp: varchar('sp', {length: 128}).notNull().default('0,0,0,0,0,0,0,0,0,0'),
    map: int('map').notNull().default(0),
    spawnPoint: int('spawnpoint').notNull().default(0),
    gm: tinyint('gm').notNull().default(0),
    party: int('party').notNull().default(0),
    buddyCapacity: int('buddyCapacity').notNull().default(25),
    createDate: timestamp('createdate').notNull().defaultNow(),
    rank: int('rank').notNull().default(1),
    rankMove: int('rankMove').notNull().default(0),
    jobRank: int('jobRank').notNull().default(1),
    jobRankMove: int('jobRankMove').notNull().default(0),
    guildId: int('guildid').notNull().default(0),
    guildRank: int('guildrank').notNull().default(5),
    messengerId: int('messengerid').notNull().default(0),
    messengerPosition: int('messengerposition').notNull().default(4),
    mountLevel: int('mountlevel').notNull().default(1),
    mountExp: int('mountexp').notNull().default(0),
    mountTiredness: int('mounttiredness').notNull().default(0),
    omokWins: int('omokwins').notNull().default(0),
    omokLosses: int('omoklosses').notNull().default(0),
    omokTies: int('omokties').notNull().default(0),
    matchCardWins: int('matchcardwins').notNull().default(0),
    matchCardLosses: int('matchcardlosses').notNull().default(0),
    matchCardTies: int('matchcardties').notNull().default(0),
    merchantMesos: int('MerchantMesos').default(0),
    hasMerchant: tinyint('HasMerchant').default(0),
    equipSlots: int('equipslots').notNull().default(96),
    useSlots: int('useslots').notNull().default(96),
    setupSlots: int('setupslots').notNull().default(96),
    etcSlots: int('etcslots').notNull().default(96),
    familyId: int('familyId').notNull().default(-1),
    monsterBookCover: int('monsterbookcover').notNull().default(0),
    allianceRank: int('allianceRank').notNull().default(5),
    vanquisherStage: int('vanquisherStage').notNull().default(0),
    ariantPoints: int('ariantPoints').notNull().default(0),
    dojoPoints: int('dojoPoints').notNull().default(0),
    lastDojoStage: int('lastDojoStage').notNull().default(0),
    finishedDojoTutorial: tinyint('finishedDojoTutorial').notNull().default(0),
    vanquisherKills: int('vanquisherKills').notNull().default(0),
    summonValue: int('summonValue').notNull().default(0),
    partnerId: int('partnerId').notNull().default(0),
    marriageItemId: int('marriageItemId').notNull().default(0),
    reBorn: int('reborns').notNull().default(0),
    pqPoints: int('PQPoints').notNull().default(0),
    dataString: varchar('dataString', {length: 64}).notNull().default(''),
    lastLogoutTime: timestamp('lastLogoutTime').notNull().default(new Date('2014-12-31 21:00:00')),
    lastExpGainTime: timestamp('lastExpGainTime').notNull().default(new Date('2014-12-31 21:00:00')),
    partySearch: tinyint('partySearch').notNull().default(1),
    jailExpire: bigint('jailexpire', {mode: 'number'}).notNull().default(0),
  },
);


export const guilds = mysqlTable(
  'guilds',
  {
    guildId: serial('guildid').primaryKey(),
    leader: int('leader').notNull().default(0),
    gp: int('GP').notNull().default(0),
    logo: int('logo'),
    logoColor: smallint('logoColor').notNull().default(0),
    name: varchar('name', {length: 45}).notNull(),
    rank1Title: varchar('rank1title', {length: 45}).notNull().default('Master'),
    rank2Title: varchar('rank2title', {length: 45}).notNull().default('Jr. Master'),
    rank3Title: varchar('rank3title', {length: 45}).notNull().default('Member'),
    rank4Title: varchar('rank4title', {length: 45}).notNull().default('Member'),
    rank5Title: varchar('rank5title', {length: 45}).notNull().default('Member'),
    capacity: int('capacity').notNull().default(10),
    logoBG: int('logoBG'),
    logoBGColor: smallint('logoBGColor').notNull().default(0),
    notice: varchar('notice', {length: 101}),
    signature: int('signature').notNull().default(0),
    allianceId: int('allianceId').notNull().default(0)
  },
);


export const inventoryitems = mysqlTable(
  'inventoryitems',
  {
    inventoryItemId: serial('inventoryitemid').primaryKey(),
    type: tinyint('type').notNull(),
    characterId: int('characterid'),
    accountId: int('accountid'),
    itemId: int('itemid').notNull().default(0),
    inventoryType: int('inventorytype').notNull().default(0),
    position: int('position').notNull().default(0),
    quantity: int('quantity').notNull().default(0),
    owner: text('owner').notNull(),
    petId: int('petid').notNull().default(-1),
    flag: int('flag').notNull(),
    expiration: bigint('expiration', {mode: 'number'}).notNull().default(-1),
    giftFrom: varchar('giftFrom', {length: 26}).notNull().default(''),
  },
);

export const inventoryequipment = mysqlTable('inventoryequipment', {
  inventoryequipmentid: serial('inventoryequipmentid').primaryKey(),
  inventoryitemid: int('inventoryitemid').notNull().default(0),
  upgradeslots: int('upgradeslots').notNull().default(0),
  level: int('level').notNull().default(0),
  str: int('str').notNull().default(0),
  dex: int('dex').notNull().default(0),
  int: int('int').notNull().default(0),
  luk: int('luk').notNull().default(0),
  hp: int('hp').notNull().default(0),
  mp: int('mp').notNull().default(0),
  watk: int('watk').notNull().default(0),
  matk: int('matk').notNull().default(0),
  wdef: int('wdef').notNull().default(0),
  mdef: int('mdef').notNull().default(0),
  acc: int('acc').notNull().default(0),
  avoid: int('avoid').notNull().default(0),
  hands: int('hands').notNull().default(0),
  speed: int('speed').notNull().default(0),
  jump: int('jump').notNull().default(0),
  locked: int('locked').notNull().default(0),
  vicious: int('vicious').notNull().default(0),
  itemlevel: int('itemlevel').notNull().default(1),
  itemexp: int('itemexp').notNull().default(0),
  ringid: int('ringid').notNull().default(-1),
});

export const loginlog = mysqlTable('loginlog', {
  id: int('id').autoincrement().primaryKey(),
  charId: int('charId').notNull(),
  date: date('date').notNull(),
  minute: int('minute').notNull(),
});

export const shoppinglog = mysqlTable('shopping_log', {
  id: int('id').autoincrement().primaryKey(),
  user: varchar('user', {length: 16}).notNull(),
  character: varchar('character', {length: 16}).notNull(),
  charId: int('char_id'),
  gift: tinyint('gift').notNull(),
  shopId: int('shop_id').notNull(),
  shopName: varchar('shop_name', {length: 64}).notNull(),
  count: int('count').notNull(),
  price: int('price').notNull(),
  currency: varchar('currency', {length: 12}).default('点券').notNull(),
  limitGroup: varchar('limit_group', {length: 64}),
  createTime: datetime('create_time').notNull(),
});

export const msData = mysqlTable('ms_data', {
  id: int('id').autoincrement().primaryKey(),
  oid: varchar('oid', {length: 15}).notNull(),
  name: varchar('name', {length: 100}).notNull(),
  category: varchar('category', {length: 100}).notNull(),
  desc: varchar('desc', {length: 255}),
  icon: json('icon'),
  info: json('info'),
  attr: json('attr'),
});

export const notice = mysqlTable('notice', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', {length: 64}).notNull(),
  content: text('content').notNull(),
  display: tinyint('display').default(1).notNull(),
  visit: tinyint('visit').default(1).notNull(),
  createTime: datetime('create_time', {mode: 'date', fsp: 6}).notNull(),
});

export const accountsRelations = relations(accounts, ({many}) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({one, many}) => ({
  account: one(accounts, {
    fields: [characters.accountId],
    references: [accounts.id],
  }),
  guild: one(guilds, {
    fields: [characters.guildId],
    references: [guilds.guildId],
  }),
  items: many(inventoryitems)
}));

export const guildsRelations = relations(guilds, ({many, one}) => ({
  characters: many(characters),
  leaderCharacter: one(characters, {
    fields: [guilds.leader],
    references: [characters.id],
  }),
}));

export const inventoryItemsRelations = relations(inventoryitems, ({one}) => ({
  character: one(characters, {
    fields: [inventoryitems.characterId],
    references: [characters.id],
  }),
  equipment: one(inventoryequipment, {
    fields: [inventoryitems.inventoryItemId],
    references: [inventoryequipment.inventoryitemid],
  }),
}));

export const inventoryEquipmentRelations = relations(inventoryequipment, ({one}) => ({
  item: one(inventoryitems, {
    fields: [inventoryequipment.inventoryitemid],
    references: [inventoryitems.inventoryItemId],
  }),
}));