'use client';

import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Lock as LockIcon} from "lucide-react";
import type {InferSelectModel} from "drizzle-orm";
import type {inventoryequipment, inventoryitems} from "@/lib/db/schema";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from "@/components/ui/tooltip";
import {initStringPool, getItemName} from "@/lib/wasm/maple_string_pool";

type Item = InferSelectModel<typeof inventoryitems>;
type Equipment = InferSelectModel<typeof inventoryequipment>;

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: {
    id: number;
    name: string;
    equipSlots: number;
    useSlots: number;
    setupSlots: number;
    etcSlots: number;
    items?: Item[];
  };
}

// 添加模拟数据接口
interface EquipmentRequirement {
  level: number;
  str: number;
  dex: number;
  int: number;
  luk: number;
  fame: number;
  job: string;
}

// 模拟装备需求数据
const mockRequirements: Record<string, EquipmentRequirement> = {
  // 武器
  '1302000': {level: 30, str: 35, dex: 20, int: 0, luk: 0, fame: 0, job: '战士'},
  // 头盔
  '1002140': {level: 25, str: 25, dex: 0, int: 0, luk: 0, fame: 0, job: '战士'},
  // 上衣
  '1040000': {level: 20, str: 20, dex: 0, int: 0, luk: 0, fame: 0, job: '全部'},
};

function EquipmentTooltip({item, equipment, itemId}: { item: Item; equipment: Equipment; itemId: number }) {
  const requirements = mockRequirements[itemId.toString()] || {
    level: 0, str: 0, dex: 0, int: 0, luk: 0, fame: 0, job: 'Unknown'
  };
  let itemName = getItemName(itemId.toString(), 'Eqp');
  if (equipment.level > 0) {
    itemName = `${itemName}(+${equipment.level})`;
  }

  // 处理礼物来源
  const giftFrom = item.giftFrom ? (
    <div className="text-xs text-green-300 mt-2 border-t border-gray-500 pt-2">
      <span className="text-gray-400">From:</span> {item.giftFrom}
    </div>
  ) : null;

  const hasExpiration = (item.flag === 0 || item.flag === 1 || item.flag === 8) && item.expiration > 0;
  // 处理到期时间
  const expiration = hasExpiration ? (
    <div className="text-xs text-red-300 mt-1">
      <span className="text-gray-400">Expires:</span> {new Date(item.expiration).toLocaleString()}
    </div>
  ) : null;
  
  return (
    <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg w-100">
      {/* 装备名称 */}
      <div className="text-left text-yellow-400 font-bold mb-4 flex items-center justify-between">
        <span>{itemName}</span>
        {hasExpiration && (
          <span className="text-xs text-red-400">⏳</span>
        )}
      </div>

      {/* 装备图标和需求 */}
      <div className="flex gap-4">
        {/* 左侧图标 */}
        <div className="w-24 h-24 bg-gray-800 rounded flex items-center justify-center relative">
          <img
            src={`https://maplestory.io/api/GMS/255/item/${itemId}/icon`}
            alt={itemName}
            className="w-16 h-16 object-contain"
          />
          {equipment.locked > 0 && (
            <div className="absolute bottom-1 right-1 bg-gray-800 rounded-full p-0.5">
              <LockIcon className="w-4 h-4 text-yellow-500"/>
            </div>
          )}
        </div>

        {/* 右侧需求 */}
        <div className="flex-1 text-xs space-y-1">
          <div>Req Level: {requirements.level}</div>
          <div>Req Str: {requirements.str}</div>
          <div>Req Dex: {requirements.dex}</div>
          <div>Req Int: {requirements.int}</div>
          <div>Req Luk: {requirements.luk}</div>
          <div>Req Fame: {requirements.fame}</div>
          <div>Item Level: {equipment.itemlevel}</div>
        </div>
      </div>

      <div className="text-sx flex justify-center mt-1 mb-1">
        <div className="text-yellow-600 mr-1.5">beginner</div>
        <div className="text-yellow-600 mr-1.5">warrior</div>
        <div className="text-yellow-600 mr-1.5">magician</div>
        <div className="text-yellow-600 mr-1.5">bowman</div>
        <div className="text-yellow-600 mr-1.5">thief</div>
        <div className="text-yellow-600">pirate</div>
      </div>

      {/* 装备属性 */}
      <div className="pt-4 border-t border-gray-800 space-y-1 text-xs">
        {equipment.str > 0 && (
          <div>str: {equipment.str}</div>
        )}
        {equipment.dex > 0 && (
          <div>dex: {equipment.dex}</div>
        )}
        {equipment.int > 0 && (
          <div>int: {equipment.int}</div>
        )}
        {equipment.luk > 0 && (
          <div>luk: {equipment.luk}</div>
        )}
        {equipment.watk > 0 && (
          <div>watk: {equipment.watk}</div>
        )}
        {equipment.matk > 0 && (
          <div>matk: {equipment.matk}</div>
        )}
        {equipment.hp > 0 && (
          <div>HP: {equipment.hp}</div>
        )}
        {equipment.mp > 0 && (
          <div>MP: {equipment.mp}</div>
        )}
        {equipment.wdef > 0 && (
          <div>wdef: {equipment.wdef}</div>
        )}
        {equipment.mdef > 0 && (
          <div>mdef: {equipment.mdef}</div>
        )}
        {equipment.acc > 0 && (
          <div>acc: {equipment.acc}</div>
        )}
        {equipment.avoid > 0 && (
          <div>avoid: {equipment.avoid}</div>
        )}
        {equipment.speed > 0 && (
          <div>speed: {equipment.speed}</div>
        )}
        {equipment.jump > 0 && (
          <div>jump: {equipment.jump}</div>
        )}
        <div>upgradeSlots: {equipment.upgradeslots}</div>
        <div>viciousSlots: {2 - equipment.vicious}</div>
      </div>

      {/* 礼物来源和到期时间 */}
      {(giftFrom || expiration) && (
        <div className="mt-2">
          {giftFrom}
          {expiration}
        </div>
      )}
    </div>
  );
}

export function InventoryDialog({open, onOpenChange, character}: InventoryDialogProps) {
  const [activeTab, setActiveTab] = React.useState("equip");
  const [equipmentMap, setEquipmentMap] = React.useState<Map<number, Equipment>>(new Map());

  // 获取装备属性
  React.useEffect(() => {
    initStringPool();
    if (open && (activeTab === "equip" || activeTab === "equipped")) {
      const itemsToFetch = activeTab === "equipped" 
        ? character.items?.filter(item => item.type === 1 && item.inventoryType < 0) || []
        : character.items?.filter(item => item.type === 1 && item.inventoryType === 1) || [];

      if (itemsToFetch.length > 0) {
        fetch('/api/equipment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemIds: itemsToFetch.map(item => item.inventoryItemId),
          }),
        })
          .then(res => res.json())
          .then((equipment: Equipment[]) => {
            const newMap = new Map();
            equipment.forEach(eq => {
              newMap.set(eq.inventoryitemid, eq);
            });
            setEquipmentMap(newMap);
          })
          .catch(console.error);
      }
    }

    // 清理函数
    return () => {
      if (!open) {
        setEquipmentMap(new Map());
      }
    };
  }, [open, activeTab, character.items]);

  const equipItems = character.items?.filter(item => item.type === 1 && item.inventoryType === 1) || [];
  const useItems = character.items?.filter(item => item.type === 1 && item.inventoryType === 2) || [];
  const setupItems = character.items?.filter(item => item.type === 1 && item.inventoryType === 3) || [];
  const etcItems = character.items?.filter(item => item.type === 1 && item.inventoryType === 4) || [];
  const cashItems = character.items?.filter(item => item.type === 1 && item.inventoryType === 5) || [];
  const equippedItems = character.items?.filter(item => item.type === 1 && item.inventoryType < 0) || [];

  const renderSlots = (items: Item[], maxSlots: number) => {
    const slots = [];
    const itemMap = new Map();
    
    if (activeTab === "equipped") {
      // 对已装备道具使用自增位置
      items.forEach((item, index) => {
        itemMap.set(index + 1, item);
      });
    } else {
      // 其他类型道具保持原有的position映射
      items.forEach(item => {
        itemMap.set(item.position, item);
      });
    }

    for (let i = 1; i <= maxSlots; i++) {
      const item = itemMap.get(i);
      const slot = (
        <div
          key={i}
          className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center bg-gray-50 relative"
          title={item ? getItemName(item.itemId.toString()) : `Empty Slot ${i}`}
        >
          {item && (
            <>
              {(activeTab === "equip" || activeTab === "equipped") && equipmentMap.has(item.inventoryItemId) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img
                        src={`https://maplestory.io/api/GMS/255/item/${item.itemId}/icon/`}
                        alt={`Item ${item.itemId}`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                      <EquipmentTooltip
                        item={item}
                        equipment={equipmentMap.get(item.inventoryItemId)!}
                        itemId={item.itemId}
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <img
                  src={`https://maplestory.io/api/GMS/255/item/${item.itemId}/icon/`}
                  alt={`Item ${item.itemId}`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              <div className="text-xs text-gray-600 hidden">{item.itemId}</div>
              {item.quantity > 1 && (
                <div
                  className="absolute bottom-0 right-0 text-xs bg-gray-800 text-white px-1 rounded-tl">
                  {item.quantity}
                </div>
              )}
            </>
          )}
        </div>
      );
      slots.push(slot);
    }
    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{character.name}'s Inventory</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="equipped">
              Weared ({equippedItems.length})
            </TabsTrigger>
            <TabsTrigger value="equip">
              Equip ({equipItems.length}/{character.equipSlots})
            </TabsTrigger>
            <TabsTrigger value="use">
              Use ({useItems.length}/{character.useSlots})
            </TabsTrigger>
            <TabsTrigger value="setup">
              Setup ({setupItems.length}/{character.setupSlots})
            </TabsTrigger>
            <TabsTrigger value="etc">
              Etc ({etcItems.length}/{character.etcSlots})
            </TabsTrigger>
            <TabsTrigger value="cash">
              Cash ({cashItems.length}/96)
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <div className="grid grid-cols-8 gap-2">
              {activeTab === "equipped" && renderSlots(equippedItems, equippedItems.length)}
              {activeTab === "equip" && renderSlots(equipItems, character.equipSlots)}
              {activeTab === "use" && renderSlots(useItems, character.useSlots)}
              {activeTab === "setup" && renderSlots(setupItems, character.setupSlots)}
              {activeTab === "etc" && renderSlots(etcItems, character.etcSlots)}
              {activeTab === "cash" && renderSlots(cashItems, 96)}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 