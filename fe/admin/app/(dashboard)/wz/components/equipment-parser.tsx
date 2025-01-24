import { useState } from 'react';
import * as mapleWasm from '@/lib/wasm/maple_wasm';
import { getItemName, getItemDesc } from '@/lib/wasm/maple_string_pool';
import { toast } from 'react-toastify';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select';

const ISLOT_TO_CATEGORY: Record<string, string> = {
  'Wp': 'Weapon',
  'Me': 'Accessory',
  'Af': 'Accessory',
  'Ay': 'Accessory',
  'Ae': 'Accessory',
  'Pe': 'Accessory',
  'Be': 'Accessory',
  'Cp': 'Cap',
  'Sr': 'Cape',
  'Ma': 'Coat',
  'Fc': 'Face',
  'Gv': 'Glove',
  'Hr': 'Hair',
  'MaPn': 'Longcoat',
  'Pn': 'Pants',
  'Ri': 'Ring',
  'Si': 'Shield',
  'So': 'Shoes',
  'Tm': 'Taming',
  'WpSi': 'Weapon',
  'PetEquip': 'PetEquip',
  'Pet': 'Pet',
};

const AVAILABLE_CATEGORIES = Array.from(new Set(Object.values(ISLOT_TO_CATEGORY)));

const extractOidFromFilename = (filename: string): string => {
  return filename.replace('.img', '').replace(/^0+/, '');
};

const getCategoryFromIslot = (islot: string): string => {
  return ISLOT_TO_CATEGORY[islot] || 'Unknown';
};

interface ItemInfo {
  tuc: number;
  cash: number;
  islot: string;
  price: number;
  reqDEX: number;
  reqINT: number;
  reqJob: number;
  reqLUK: number;
  reqSTR: number;
  reqLevel: number;
  attackSpeed: number;
  sfx?: string;
  maxLevel?: number;
  incSpeed?: number;
  incACC?: number;
  incSTR?: number;
  incDEX?: number;
  incINT?: number;
  incLUK?: number;
  incJump?: number;
  incMHP?: number;
  incMMP?: number;
  incMAD?: number;
  incPAD?: number;
  incMDD?: number;
  incPDD?: number;
  incEVA?: number;
}

interface ItemAttr {
  hp?: number;
  mp?: number;
  acc?: number;
  str?: number;
  dex?: number;
  int?: number;
  luk?: number;
  jump?: number;
  speed?: number;
  avoid?: number;
  matk?: number;
  watk?: number;
  mdef?: number;
  wdef?: number;
}

interface ItemData {
  oid: string;
  name: string;
  desc: string | null;
  category: string;
  icon: { item: string };
  info: ItemInfo;
  attr: {
    hp?: number;
    mp?: number;
    acc?: number;
    str?: number;
    dex?: number;
    int?: number;
    luk?: number;
    jump?: number;
    speed?: number;
    avoid?: number;
    matk?: number;
    watk?: number;
    mdef?: number;
    wdef?: number;
  };
}

export function EquipmentParser() {
  const [formData, setFormData] = useState<ItemData>({
    oid: '',
    name: '',
    desc: null,
    category: '',
    icon: { item: '' },
    info: {} as ItemInfo,
    attr: {
      hp: 0,
      mp: 0,
      acc: 0,
      str: 0,
      dex: 0,
      int: 0,
      luk: 0,
      jump: 0,
      speed: 0,
      avoid: 0,
      matk: 0,
      watk: 0,
      mdef: 0,
      wdef: 0
    }
  });

  const [currentFileName, setCurrentFileName] = useState<string>('');

  const handleInputChange = (field: keyof ItemData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = async (file: File) => {
    try {
      setCurrentFileName(file.name);
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const result = mapleWasm.parse_image(file.name, uint8Array, false);
      
      // 解析JSON结果
      const parsed = JSON.parse(result);
      console.log(parsed);
      
      // 提取所需信息
      const oid = extractOidFromFilename(file.name);
      let itemName = getItemName(oid, 'Eqp');
      let itemDesc = getItemDesc(oid, 'Eqp');

      let category = getCategoryFromIslot(parsed.info.islot);
      if (oid <= '1839999' && oid >= '1800000') {
        category = 'PetEquip';
      } else if (oid <= '5001000' && oid >= '5000000') {
        category = 'Pet';
        itemName = getItemName(oid, 'Pet');
        itemDesc = getItemDesc(oid, 'Pet');
      }

      const info: ItemData = {
        oid,
        name: itemName || oid,
        desc: itemDesc,
        category,
        icon: { 
          item: parsed.info?.icon?.canvas || '' 
        },
        info: {
          tuc: parsed.info?.tuc || 0,
          cash: parsed.info?.cash || 0,
          islot: parsed.info?.islot || '',
          price: parsed.info?.price || 0,
          reqDEX: parsed.info?.reqDEX || 0,
          reqINT: parsed.info?.reqINT || 0,
          reqJob: parsed.info?.reqJob || 0,
          reqLUK: parsed.info?.reqLUK || 0,
          reqSTR: parsed.info?.reqSTR || 0,
          reqLevel: parsed.info?.reqLevel || 0,
          attackSpeed: parsed.info?.attackSpeed || 0,
        },
        attr: {
          hp: parsed.info?.incMHP || 0,
          mp: parsed.info?.incMMP || 0,
          acc: parsed.info?.incACC || 0,
          str: parsed.info?.incSTR || 0,
          dex: parsed.info?.incDEX || 0,
          int: parsed.info?.incINT || 0,
          luk: parsed.info?.incLUK || 0,
          jump: parsed.info?.Jump || 0,
          speed: parsed.info?.incSpeed || 0,
          avoid: parsed.info?.incEVA || 0,
          matk: parsed.info?.incMAD || 0,
          watk: parsed.info?.incPAD || 0,
          mdef: parsed.info?.incMDD || 0,
          wdef: parsed.info?.incPDD || 0,
        }
      };
      if (parsed.info?.level?.info?.maxLevel) {
        info.info.maxLevel = parsed.info?.level?.info?.maxLevel;
      }

      setFormData(info);

    } catch (error) {
      console.error('解析文件失败:', error);
      toast.error('Failed to parse file');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.img')) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.img';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    setFormData({
      oid: '',
      name: '',
      desc: null,
      category: '',
      icon: { item: '' },
      info: {} as ItemInfo,
      attr: {
        hp: 0,
        mp: 0,
        acc: 0,
        str: 0,
        dex: 0,
        int: 0,
        luk: 0,
        jump: 0,
        speed: 0,
        avoid: 0,
        matk: 0,
        watk: 0,
        mdef: 0,
        wdef: 0
      }
    });
    setCurrentFileName('');
  };

  return (
    <div className="flex gap-8">
      {/* 左侧预览区域 */}
      <div className="w-1/2 pt-4">
        {formData.oid ? (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg max-w-md relative">
            {/* 清理按钮和文件名 */}
            <div className="absolute -top-8 left-0 right-0 flex justify-between items-center text-sm text-gray-500">
              <div className="truncate">
                Choose file: {currentFileName}
              </div>
              <button
                onClick={handleClear}
                className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>

            {/* 装备名称和现金道具标识 */}
            <div className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
              {formData.name}
              {formData.info.cash === 1 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cash Item
                </span>
              )}
            </div>

            {/* 装备图标和基本信息 */}
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 bg-gray-800 rounded flex items-center justify-center relative shrink-0">
                <img
                  src={`data:image/png;base64,${formData.icon.item}`}
                  alt={formData.name}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="text-xs text-gray-600 hidden">{formData.oid}</div>
              </div>

              {/* 装备描述 */}
              <div className="text-sm text-gray-300">
                {formData.desc}
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-500 my-3"></div>

            {/* 装备要求 */}
            <div className="space-y-1 text-sm mb-3">
              {formData.info.reqLevel > 0 && (
                <div className={formData.info.reqLevel > 0 ? 'text-red-400' : ''}>
                  需求等级: {formData.info.reqLevel}
                </div>
              )}
              {formData.info.reqSTR > 0 && (
                <div className={formData.info.reqSTR > 0 ? 'text-red-400' : ''}>
                  需求力量: {formData.info.reqSTR}
                </div>
              )}
              {formData.info.reqDEX > 0 && (
                <div className={formData.info.reqDEX > 0 ? 'text-red-400' : ''}>
                  需求敏捷: {formData.info.reqDEX}
                </div>
              )}
              {formData.info.reqINT > 0 && (
                <div className={formData.info.reqINT > 0 ? 'text-red-400' : ''}>
                  需求智力: {formData.info.reqINT}
                </div>
              )}
              {formData.info.reqLUK > 0 && (
                <div className={formData.info.reqLUK > 0 ? 'text-red-400' : ''}>
                  需求运气: {formData.info.reqLUK}
                </div>
              )}
              {formData.info.maxLevel && (
                <div>最高等级: {formData.info.maxLevel}</div>
              )}
            </div>

            {/* 职业要求 */}
            <div className="text-sm mb-3 flex items-center gap-2">
              <div className="text-gray-300 whitespace-nowrap">职业要求:</div>
              <div className="flex flex-wrap gap-2">
                {formData.info.reqJob === -1 && <span className="text-yellow-400">新手</span>}
                {formData.info.reqJob === 0 && <span className="text-yellow-400">全职业</span>}
                {formData.info.reqJob === 1 && <span className="text-yellow-400">战士</span>}
                {formData.info.reqJob === 2 && <span className="text-yellow-400">魔法师</span>}
                {formData.info.reqJob === 3 && <span className="text-yellow-400">弓箭手</span>}
                {formData.info.reqJob === 4 && <span className="text-yellow-400">飞侠</span>}
                {formData.info.reqJob === 5 && <span className="text-yellow-400">海盗</span>}
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-500 my-3"></div>

            {/* 装备属性 */}
            <div className="space-y-1 text-sm">
              {(formData.attr?.str ?? 0) > 0 && <div>力量: +{formData.attr?.str}</div>}
              {(formData.attr?.dex ?? 0) > 0 && <div>敏捷: +{formData.attr?.dex}</div>}
              {(formData.attr?.int ?? 0) > 0 && <div>智力: +{formData.attr?.int}</div>}
              {(formData.attr?.luk ?? 0) > 0 && <div>运气: +{formData.attr?.luk}</div>}
              {(formData.attr?.watk ?? 0) > 0 && <div>攻击力: +{formData.attr?.watk}</div>}
              {(formData.attr?.matk ?? 0) > 0 && <div>魔法攻击力: +{formData.attr?.matk}</div>}
              {(formData.attr?.wdef ?? 0) > 0 && <div>物理防御力: +{formData.attr?.wdef}</div>}
              {(formData.attr?.mdef ?? 0) > 0 && <div>魔法防御力: +{formData.attr?.mdef}</div>}
              {(formData.attr?.speed ?? 0) > 0 && <div>移动速度: +{formData.attr?.speed}</div>}
              {(formData.attr?.jump ?? 0) > 0 && <div>跳跃力: +{formData.attr?.jump}</div>}
            </div>

            {/* 升级信息 */}
            {formData.info.tuc > 0 && (
              <>
                <div className="border-t border-gray-500 my-3"></div>
                <div className="text-sm">
                  升级次数: {formData.info.tuc}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-4xl text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-500 text-center">
              Drag .img file here<br />
              or click to choose file
            </p>
          </div>
        )}
      </div>

      {/* 中间属性编辑区域 */}
      {formData.oid && (
        <div className="w-1/3 pt-4">
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg">
            <div className="space-y-4">
              {/* 装备ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Equipment ID
                </label>
                <input
                  type="text"
                  value={formData.oid}
                  onChange={(e) => setFormData(prev => ({ ...prev, oid: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
                />
              </div>

              {/* 装备名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Equipment Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
                />
              </div>

              {/* 装备描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.desc || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white resize-none h-20"
                />
              </div>

              {/* 装备分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="w-full bg-gray-700 border-gray-500 text-white">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectGroup>
                      {AVAILABLE_CATEGORIES.map(category => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          className="text-white hover:bg-gray-600 focus:bg-gray-600"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/wz', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          items: [{
                            oid: formData.oid,
                            name: formData.name,
                            category: formData.category,
                            desc: formData.desc,
                            icon: formData.icon,
                            info: formData.info,
                            attr: formData.attr,
                          }],
                          strategy: 'override',
                        }),
                      });

                      const result = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(result.error || 'Upload failed');
                      }

                      toast.success(`Upload success!`);
                      
                      if (result.results.errors?.length > 0) {
                        console.error('Upload errors:', result.results.errors);
                        toast.warning(`There are ${result.results.errors.length} errors, please check the console for details`);
                      }
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast.error(error instanceof Error ? error.message : 'Upload failed');
                    }
                  }}
                >
                  Upload to database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 