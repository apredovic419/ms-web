export type CreateProduct = {
  id: string;
  name: string;
};

export interface Breadcrumb {
  href: string;
  label: string;
}

export interface BreadcrumbConfig {
  [path: string]: string;
}

export const currencyList = [
  {id: '点券', name: 'Cash'},
]

export const deliveryMethodList = [
  {id: 0, name: 'Game Store'},
  {id: 9, name: 'Game Express'},
  {id: 8, name: 'Email'},
]

export const validExtendFields = [
  'upgradeslots',
  'level',
  'str',
  'dex',
  'int',
  'luk',
  'hp',
  'mp',
  'watk',
  'matk',
  'wdef',
  'mdef',
  'acc',
  'avoid',
  'hands',
  'speed',
  'jump',
  'locked',
  'vicious',
  'itemlevel',
  'itemexp',
  'ringid',
];

export const JobName: { [key: number]: string } = {
  0: "Beginner",
  100: "Warrior",
  110: "Fighter",
  111: "Crusader",
  112: "Hero",
  120: "Page",
  121: "W. Knight", // White Knight
  122: "Paladin",
  130: "Spearman",
  131: "D. Knight", // Dragon Knight
  132: "Dark Knight", // Dark Knight
  200: "Magician",
  210: "F/P Wiz", // Fire/Poison Wizard
  211: "F/P Mage", // Fire/Poison Mage
  212: "F/P Arch", // Fire/Poison Arch Mage
  220: "I/L Wiz", // Ice/Lightning Wizard
  221: "I/L Mage", // Ice/Lightning Mage
  222: "I/L Arch", // Ice/Lightning Arch Mage
  230: "Cleric",
  231: "Priest",
  232: "Bishop",
  300: "Bowman",
  310: "Hunter",
  311: "Ranger",
  312: "Bow Master",
  320: "C'bowman", // Crossbowman
  321: "Sniper",
  322: "C'bow Master", // Crossbow Master
  400: "Thief",
  410: "Assassin",
  411: "Hermit",
  412: "NL", // Night Lord
  420: "Bandit",
  421: "Chief Band", // Chief Bandit
  422: "Shadower",
  500: "Pirate",
  510: "Brawler",
  511: "Marauder",
  512: "Bucc", // Buccaneer
  520: "Gunslinger",
  521: "Outlaw",
  522: "Corsair",
  900: "GM",
  910: "Super GM",
  1000: "Noblesse",
  1100: "Dawn Warrior",
  1110: "DW 1", // Dawn Warrior 1
  1111: "DW 2", // Dawn Warrior 2
  1112: "DW 3", // Dawn Warrior 3
  1200: "Blaze Wiz", // Blaze Wizard
  1210: "BW 1", // Blaze Wizard 1
  1211: "BW 2", // Blaze Wizard 2
  1212: "BW 3", // Blaze Wizard 3
  1300: "Wind Archer",
  1310: "WA 1", // Wind Archer 1
  1311: "WA 2", // Wind Archer 2
  1312: "WA 3", // Wind Archer 3
  1400: "Night Walker",
  1410: "NW 1", // Night Walker 1
  1411: "NW 2", // Night Walker 2
  1412: "NW 3", // Night Walker 3
  1500: "Thunder Breaker",
  1510: "TB 1", // Thunder Breaker 1
  1511: "TB 2", // Thunder Breaker 2
  1512: "TB 3", // Thunder Breaker 3
  2000: "Legend",
  2100: "Aran",
  2110: "Aran 1",
  2111: "Aran 2",
  2112: "Aran 3",
  2200: "Evan",
  2210: "Evan 1",
  2211: "Evan 2",
  2212: "Evan 3",
};
