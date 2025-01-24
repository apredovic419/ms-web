import * as mapleWasm from './maple_wasm';

export type ItemCategory = 'Eqp' | 'Etc' | 'Consume' | 'Cash' | 'Ins' | 'Pet' | 'Npc' | 'Mob' | 'Map';

interface StringCache {
  timestamp: number;
  names: Record<ItemCategory, Record<string, string>>;
  descriptions: Record<ItemCategory, Record<string, string>>;
}

const CACHE_KEY = 'maple_string_pool';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1天的毫秒数

// 检查缓存是否有效
function isCacheValid(cache: StringCache | null): boolean {
  if (!cache) return false;
  const now = Date.now();
  return now - cache.timestamp < CACHE_TTL;
}

// 从localStorage获取缓存
function getCache(): StringCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

// 设置缓存
function setCache(names: Record<ItemCategory, Record<string, string>>, descriptions: Record<ItemCategory, Record<string, string>>) {
  const cache: StringCache = {
    timestamp: Date.now(),
    names,
    descriptions
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}


async function loadEqpStringFile(): Promise<{ itemName: Record<string, string>, itemDesc: Record<string, string> }> {
  const response = await fetch(`/string/Eqp.img`);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let itemName: Record<string, string> = {};
  let itemDesc: Record<string, string> = {};
  const result = JSON.parse(mapleWasm.parse_image('Eqp.img', uint8Array, false));
  for (const category in result["Eqp"]) {
    for (const item in result["Eqp"][category]) {
      const itemData = result["Eqp"][category][item];
      itemName[item] = itemData['name'];
      if (itemData['desc']) {
        itemDesc[item] = itemData['desc'];
      }
    }
  }
  return { itemName, itemDesc };
}

async function loadMapStringFile(): Promise<{ itemName: Record<string, string>, itemDesc: Record<string, string> }> {
    const response = await fetch(`/string/Map.img`);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let itemName: Record<string, string> = {};
    let itemDesc: Record<string, string> = {};
    const result = JSON.parse(mapleWasm.parse_image('Etc.img', uint8Array, false));
    for (const category in result) {
      for (const itemId in result[category]) {
        const itemData = result[category][itemId];
        const streetName = itemData['streetName'];
        const mapName = itemData['mapName'];
        if (streetName && mapName) {
          itemName[itemId] = `${streetName} - ${mapName}`;
        } else {
          itemName[itemId] = mapName;
        }
        if (itemData['mapDesc']) {
            itemDesc[itemId] = itemData['mapDesc'];
        }
      }
    }
    return { itemName, itemDesc };
}


async function loadEtcStringFile(): Promise<{ itemName: Record<string, string>, itemDesc: Record<string, string> }> {
  const response = await fetch(`/string/Etc.img`);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let itemName: Record<string, string> = {};
  let itemDesc: Record<string, string> = {};
  const result = JSON.parse(mapleWasm.parse_image('Map.img', uint8Array, false));
  for (const itemId in result["Etc"]) {
      const itemData = result["Etc"][itemId];
      itemName[itemId] = itemData['name'];
      if (itemData['desc']) {
          itemDesc[itemId] = itemData['desc'];
      }
    }
    return { itemName, itemDesc };
}

async function loadStringFile(filename: string): Promise<{ itemName: Record<string, string>, itemDesc: Record<string, string> }> {
    const response = await fetch(`/string/${filename}`);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const result = JSON.parse(mapleWasm.parse_image(filename, uint8Array, false));
    let itemName: Record<string, string> = {};
    let itemDesc: Record<string, string> = {};
    for (const itemId in result) {
        const itemData = result[itemId];
        itemName[itemId] = itemData['name'];
        if (itemData['desc']) {
            itemDesc[itemId] = itemData['desc'];
        }
    }
    return { itemName, itemDesc };
}


// 初始化字符串池
export async function initStringPool(): Promise<void> {
  // 检查缓存
  const cache = getCache();
  if (isCacheValid(cache)) {
    return;
  }

  try {
    // 分别加载各个分类的字符串
    const [eqpStrings, etcStrings, consumeStrings, cashStrings, insStrings, petStrings, npcStrings, mobStrings, mapStrings] = await Promise.all([
      loadEqpStringFile(),
      loadEtcStringFile(),
      loadStringFile('Consume.img'),
      loadStringFile('Cash.img'),
      loadStringFile('Ins.img'),
      loadStringFile('Pet.img'),
      loadStringFile('Npc.img'),
      loadStringFile('Mob.img'),
      loadMapStringFile(),
    ]);

    // 按分类存储名称
    const names: Record<ItemCategory, Record<string, string>> = {
      Eqp: eqpStrings.itemName,
      Etc: etcStrings.itemName,
      Consume: consumeStrings.itemName,
      Cash: cashStrings.itemName,
      Ins: insStrings.itemName,
      Pet: petStrings.itemName,
      Npc: npcStrings.itemName,
      Mob: mobStrings.itemName,
      Map: mapStrings.itemName
    };

    // 目前描述和名称使用相同的数据
    const descriptions: Record<ItemCategory, Record<string, string>> = {
      Eqp: eqpStrings.itemDesc,
      Etc: etcStrings.itemDesc,
      Consume: consumeStrings.itemDesc,
      Cash: cashStrings.itemDesc,
      Ins: insStrings.itemDesc,
      Pet: petStrings.itemDesc,
      Npc: npcStrings.itemDesc,
      Mob: mobStrings.itemDesc,
      Map: mapStrings.itemDesc
    };

    // 保存到缓存
    setCache(names, descriptions);
  } catch (error) {
    console.error('Failed to initialize string pool:', error);
  }
}

// 获取物品名称
export function getItemName(id: string, category?: ItemCategory): string {
  const cache = getCache();
  if (!cache) return id;

  if (category) {
    return cache.names[category]?.[id] || id;
  }

  // 如果没有指定分类，遍历所有分类查找第一个匹配的名称
  for (const cat of Object.keys(cache.names) as ItemCategory[]) {
    const name = cache.names[cat][id];
    if (name) return name;
  }

  return id;
}

// 获取物品描述
export function getItemDesc(id: string, category?: ItemCategory): string | null {
  const cache = getCache();
  if (!cache) return null;

  if (category) {
    return cache.descriptions[category]?.[id] || null;
  }

  // 如果没有指定分类，遍历所有分类查找第一个匹配的描述
  for (const cat of Object.keys(cache.descriptions) as ItemCategory[]) {
    const desc = cache.descriptions[cat][id];
    if (desc) return desc;
  }

  return null;
}

export function isInitialized(): boolean {
  return isCacheValid(getCache());
}

export function getItemIds(category: ItemCategory): string[] {
  const cache = getCache();
  if (!cache) return [];
  return Object.keys(cache.names[category] || {});
}
