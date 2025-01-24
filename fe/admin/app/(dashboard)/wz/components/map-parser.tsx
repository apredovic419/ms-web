import { useState } from 'react';
import { toast } from 'react-toastify';
import * as mapleWasm from '@/lib/wasm/maple_wasm';
import { getItemName, getItemDesc } from '@/lib/wasm/maple_string_pool';

interface MobCount {
  oid: string;
  count: number;
}

interface MapData {
  oid: string;
  name: string;
  desc: string | null;
  icon: {
    mini_map: string;
  };
  info: {
    mob?: MobCount[];    // 怪物ID列表
    npc?: string[];    // NPC ID列表
    portal?: string[]; // 传送门类型列表
  };
}

export function MapParser() {
  const [formData, setFormData] = useState<MapData>({
    oid: '',
    name: '',
    desc: null,
    icon: {
      mini_map: '',
    },
    info: {
    },
  });

  const [currentFileName, setCurrentFileName] = useState<string>('');

  const extractOidFromFilename = (filename: string): string => {
    return filename.replace('.img', '').replace(/^0+/, '');
  };

  const handleFileChange = async (file: File) => {
    try {
      setCurrentFileName(file.name);
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const result = mapleWasm.parse_image(file.name, uint8Array, false);
      
      const parsed = JSON.parse(result);
      const oid = extractOidFromFilename(file.name);
      const fullMapName = getItemName(oid, 'Map');
      // 如果名称包含 '-'，取最后一部分，否则使用完整名称
      const mapName = fullMapName.includes('-') 
        ? fullMapName.split('-').pop()?.trim() 
        : fullMapName;
      const mapDesc = getItemDesc(oid, 'Map');

      // 提取生物信息
      const mobs: string[] = [];
      const npcs: string[] = [];
      if (parsed.life) {
        Object.values(parsed.life).forEach((life: any) => {
          if (life.type === 'm') {
            mobs.push(life.id.toString());
          } else if (life.type === 'n') {
            npcs.push(life.id.toString());
          }
        });
      }

      let mobCount = new Map<string, number>();
      mobs.forEach(mob => {
        mobCount.set(mob, (mobCount.get(mob) || 0) + 1);
      });

      // 提取传送门信息
      const portals: string[] = [];
      if (parsed.portal) {
        Object.values(parsed.portal).forEach((portal: any) => {
          if (portal.tm) {
            portals.push(portal.tm.toString());
          }
        });
      }

      const info: MapData = {
        oid,
        name: mapName || oid,
        desc: mapDesc,
        icon: {
          mini_map: parsed.miniMap?.canvas.canvas || '',
        },
        info: {},
      };
      if (mobCount.size > 0) {
        info.info.mob = Array.from(mobCount.entries()).map(([oid, count]) => ({ oid, count }));
      }
      if (npcs.length > 0) {
        info.info.npc = Array.from(new Set(npcs));
      }
      if (portals.length > 0) {
        info.info.portal = Array.from(new Set(portals));
      }
      console.log(info);

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
      icon: {
        mini_map: '',
      },
      info: {
        mob: [],
        npc: [],
        portal: [],
      },
    });
    setCurrentFileName('');
  };

  return (
    <div className="flex gap-6">
      {/* 左侧小地图预览 */}
      <div className="w-1/2 pt-4">
        {formData.oid ? (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg relative">
            {/* 清理按钮和文件名 */}
            <div className="absolute -top-8 left-0 right-0 flex justify-between items-center text-sm text-gray-500">
              <div className="truncate">
                Choose file: {currentFileName}
              </div>
              <button onClick={handleClear} className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>

            {/* 地图名称 */}
            <div className="text-yellow-400 font-bold mb-4">
              {formData.name}
            </div>

            {/* 小地图 */}
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
              {formData.icon.mini_map ? (
                <img
                  src={`data:image/png;base64,${formData.icon.mini_map}`}
                  alt={formData.name}
                  className="max-w-full h-auto object-contain"
                />
              ) : (
                <div className="text-gray-500 text-sm">No minimap available</div>
              )}
            </div>

            {/* 地图描述 */}
            {formData.desc && (
              <div className="mt-4 text-sm text-gray-300">
                {formData.desc}
              </div>
            )}

            {/* 地图详细信息 */}
            <div className="mt-4 space-y-4">
              {/* 怪物列表 */}
              {formData.info.mob && formData.info.mob.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">怪物列表</div>
                  <div className="space-y-1">
                    {formData.info.mob.map(mob => (
                      <div key={mob.oid} className="flex justify-between items-center text-sm">
                        <span>{getItemName(mob.oid, 'Mob') || mob.oid}</span>
                        <span className="text-gray-400">x{mob.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NPC列表 */}
              {formData.info.npc && formData.info.npc.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">NPC列表</div>
                  <div className="space-y-1">
                    {formData.info.npc.map(npcId => (
                      <div key={npcId} className="text-sm">
                        {getItemName(npcId, 'Npc') || npcId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {/* 右侧输入区域 */}
      {formData.oid && (
        <div className="w-1/2 pt-4">
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg">
            <div className="space-y-4">
              {/* 地图 ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Map ID
                </label>
                <input
                  type="text"
                  value={formData.oid}
                  onChange={(e) => setFormData(prev => ({ ...prev, oid: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
                />
              </div>

              {/* 地图名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Map Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
                />
              </div>

              {/* 地图描述 */}
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

              {/* 上传按钮 */}
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
                            category: 'Map',
                            desc: formData.desc,
                            icon: formData.icon,
                            info: formData.info,
                          }],
                          strategy: 'override',
                        }),
                      });

                      const result = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(result.error || 'Upload failed');
                      }

                      toast.success('Upload success!');
                      
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