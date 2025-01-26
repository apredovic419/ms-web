import { useState } from 'react';
import * as mapleWasm from '@/lib/wasm/maple_wasm';
import { getItemName, getItemDesc, ItemCategory } from '@/lib/wasm/maple_string_pool';
import { toast } from 'react-toastify';
import { Check, ChevronsUpDown, Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ItemData {
  id: string;
  name: string;
  desc: string | null;
  icon: string;
  price: number;
  slotMax: number;
  tradeBlock: boolean;
  notSale: boolean;
  cash: boolean;
  type: 'Consume' | 'Etc' | 'Cash' | 'Ins';
  quest: boolean;
}

export function ItemParser() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [open, setOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'current' | 'skip' | 'override' | 'error'>('current');
  const [editingField, setEditingField] = useState<'name' | 'id' | 'desc' | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleFileChange = async (file: File) => {
    if (!file || !file.name.endsWith('.img')) return;

    setIsLoading(true);
    const startTime = performance.now();
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const result = mapleWasm.parse_image(file.name, uint8Array, false);

      // 解析JSON结果
      const parsed = JSON.parse(result);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid file format');
      }

      // 根据文件名判断道具类型
      const filename = file.name.toLowerCase();

      // 处理多个道具的数据
      const parsedItems: ItemData[] = Object.entries(parsed).map(([id, data]: [string, any]) => {
        const itemId = parseInt(id);
        let itemType: ItemData['type'] = 'Consume';
        if (itemId >= 3000000 && itemId <= 3999999) {
          itemType = 'Ins';
        } else if (itemId >= 4000000 && itemId <= 4999999) {
          itemType = 'Etc';
        } else if (itemId >= 5000000 && itemId <= 5999999) {
          itemType = 'Cash';
        }

        if (!data?.info?.icon?.canvas) {
          return null;
        }
        return {
          id: itemId.toString(),
          name: getItemName(itemId.toString(), itemType as ItemCategory) || id,  // 如果没有名称，使用ID
          desc: getItemDesc(itemId.toString(), itemType as ItemCategory) || '',
          icon: data.info.icon.canvas,
          price: data.info.price || 0,
          slotMax: data.info.slotMax || undefined,
          tradeBlock: data.info.tradeBlock || false,
          notSale: data.info.notSale || false,
          cash: data.info.cash || false,
          type: itemType,
          quest: data.info.quest || false,
        };
      }).filter(Boolean) as ItemData[];  // 过滤掉无效数据


      if (parsedItems.length === 0) {
        throw new Error('No valid items found');
      }

      setItems(parsedItems);
      setSelectedItem(null);

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      toast.success(`Successfully parsed ${parsedItems.length} items, cost ${duration} seconds`);
    } catch (error) {
      console.error('Failed to parse file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setItems([]);
      setSelectedItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileChange(file);
    }
  };

  // 添加一个更新数据的辅助函数
  const updateItemData = (updatedItem: ItemData) => {
    // 更新 selectedItem
    setSelectedItem(updatedItem);

    // 更新 items 数组中的对应项
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* 文件选择区域 */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200",
          isLoading ? "border-gray-300 bg-gray-50" : "border-gray-300 hover:border-gray-400",
          "cursor-pointer",
          items.length > 0 ? "py-3" : "py-12"
        )}
        onClick={() => {
          if (!isLoading) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.img';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileChange(file);
            };
            input.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isLoading) {
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.img')) {
              handleFileChange(file);
            }
          }
        }}
      >
        <div className="flex items-center justify-center gap-4 px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "text-gray-400 transition-all duration-200",
              items.length > 0 ? "h-6 w-6" : "h-12 w-12 mb-4"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className={cn(
            "text-gray-600 transition-all duration-200",
            items.length > 0 ? "text-sm" : "text-base text-center"
          )}>
            {isLoading ? (
              " Parsing file..."
            ) : items.length > 0 ? (
              "Drag and drop a new file here or click Replace File"
            ) : (
              <>
              Drag .img file here<br />
              or click to choose file
              </>
            )}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex gap-8">
          {/* 左侧选择区域 */}
          <div className="w-1/4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Item List ({items.length})</h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsGridView(!isGridView)}
                title={isGridView ? "Switch to list view" : "Switch to grid view"}
              >
                {isGridView ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedItem ? `${selectedItem.id} - ${selectedItem.name}` : "Select an item..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search Items..." />
                  <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {items.map(item => (
                    <CommandItem key={item.id} onSelect={() => {
                      setSelectedItem(item);
                      setOpen(false);
                    }}>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <img src={`data:image/png;base64,${item.icon}`} alt={item.name} className="w-6 h-6 object-contain" />
                      <span className="truncate flex-1">{item.id} - {item.name}</span>
                    </CommandItem>
                  ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 中间预览区域 */}
          <div className="w-2/4">
            {selectedItem ? (
              <div className="bg-gray-600 text-white rounded-lg shadow-lg overflow-hidden">
                {/* 顶部信息栏 */}
                <div className="bg-gray-700 px-4 py-3">
                  {editingField === 'name' ? (
                    <input
                      type="text"
                      className="w-full bg-gray-800 text-yellow-400 font-bold text-lg px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => {
                        if (selectedItem) {
                          updateItemData({ ...selectedItem, name: editValue });
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (selectedItem) {
                            updateItemData({ ...selectedItem, name: editValue });
                          }
                          setEditingField(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="text-yellow-400 font-bold text-lg cursor-pointer hover:bg-gray-600/50 px-2 py-1 rounded"
                      onClick={() => {
                        setEditValue(selectedItem?.name || '');
                        setEditingField('name');
                      }}
                    >
                      {selectedItem?.name}
                    </div>
                  )}
                  <div className="text-gray-400 text-sm flex gap-2">
                    <span>ID: {editingField === 'id' ? (
                      <input
                        type="text"
                        className="w-24 bg-gray-800 text-gray-300 px-2 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (selectedItem) {
                            updateItemData({ ...selectedItem, id: editValue });
                          }
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (selectedItem) {
                              updateItemData({ ...selectedItem, id: editValue });
                            }
                            setEditingField(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingField(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:bg-gray-600/50 px-2 py-0.5 rounded"
                        onClick={() => {
                          setEditValue(selectedItem?.id || '');
                          setEditingField('id');
                        }}
                      >
                        {selectedItem?.id}
                      </span>
                    )}</span>
                    <span>·</span>
                    <span>Category: {selectedItem?.type}</span>
                  </div>
                </div>

                {/* 主要内容区 */}
                <div className="p-4">
                  {/* 图标和基本属性 */}
                  <div className="flex gap-6 items-start">
                    <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center p-4">
                      <img
                        src={`data:image/png;base64,${selectedItem.icon}`}
                        alt={selectedItem.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700 rounded p-3">
                          <div className="text-gray-400 text-xs mb-1">Price</div>
                          <div className="text-sm">{selectedItem.price} Meso</div>
                        </div>
                        <div className="bg-gray-700 rounded p-3">
                          <div className="text-gray-400 text-xs mb-1">Slot Max</div>
                          <div className="text-sm">{selectedItem.slotMax}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {selectedItem.tradeBlock && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            禁止交易
                          </span>
                        )}
                        {selectedItem.quest && (
                          <span className="px-2 py-1 bg-blue-500/20 text-white-400 rounded text-xs">
                            任务道具
                          </span>
                        )}
                        {selectedItem.notSale && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            禁止出售
                          </span>
                        )}
                        {selectedItem.cash && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            商城道具
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 描述信息 */}
                  {(selectedItem?.desc || editingField === 'desc') && (
                    <div className="mt-4 p-3 bg-gray-700/50 rounded">
                      <div className="text-gray-400 text-xs mb-1">Description</div>
                      {editingField === 'desc' ? (
                        <textarea
                          className="w-full bg-gray-800 text-gray-200 text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (selectedItem) {
                              updateItemData({ ...selectedItem, desc: editValue });
                            }
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              if (selectedItem) {
                                updateItemData({ ...selectedItem, desc: editValue });
                              }
                              setEditingField(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingField(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-200 cursor-pointer hover:bg-gray-600/50 px-2 py-1 rounded"
                          onClick={() => {
                            setEditValue(selectedItem?.desc || '');
                            setEditingField('desc');
                          }}
                        >
                          {selectedItem?.desc}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-100 rounded-lg">
                <p className="text-gray-500">Please select an item to view details</p>
              </div>
            )}
          </div>

          {/* 右侧控制面板 */}
          <div className="w-1/4 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Upload Options</h3>
              
              <div className="space-y-3">
              <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="current"
                    checked={uploadMode === 'current'}
                    onChange={(e) => setUploadMode(e.target.value as 'skip')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Upload selected item</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="skip"
                    checked={uploadMode === 'skip'}
                    onChange={(e) => setUploadMode(e.target.value as 'skip')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Skip duplicate items</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="override"
                    checked={uploadMode === 'override'}
                    onChange={(e) => setUploadMode(e.target.value as 'override')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Override duplicate items</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="error"
                    checked={uploadMode === 'error'}
                    onChange={(e) => setUploadMode(e.target.value as 'error')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Error on duplicate items</span>
                </label>
              </div>
            </div>

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
              onClick={async () => {
                try {
                  if (uploadMode === 'current' && !selectedItem) {
                    toast.error('Please select an item first');
                    return;
                  }

                  const itemsToUpload = uploadMode === 'current' ? [selectedItem!] : items;
                  const uploadStrategy = uploadMode === 'current' ? 'override' : uploadMode;

                  const response = await fetch('/api/wz', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      items: itemsToUpload.map(item => ({
                        oid: item.id,
                        name: item.name,
                        category: item.type,
                        desc: item.desc,
                        icon: {item: item.icon},
                        info: null,
                        attr: null,
                      })),
                      strategy: uploadStrategy,
                    }),
                  });

                  const result = await response.json();
                  
                  if (!response.ok) {
                    throw new Error(result.error || 'Upload failed');
                  }

                  toast.success(
                    `Upload completed! Success: ${result.results.success}, Skipped: ${result.results.skipped}`
                  );
                  
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
      )}

      {/* 网格视图 */}
      {items.length > 0 && isGridView && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                "bg-gray-600 text-white p-4 rounded-lg shadow-lg cursor-pointer transition-colors",
                selectedItem?.id === item.id ? "ring-2 ring-blue-500" : "hover:bg-gray-500"
              )}
              onClick={() => setSelectedItem(item)}
            >
              {/* 道具名称 */}
              <div className="text-yellow-400 font-bold mb-2 truncate">
                {item.name}
              </div>

              {/* 道具图标 */}
              <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center mb-2">
                <img
                  src={`data:image/png;base64,${item.icon}`}
                  alt={item.name}
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* 道具信息 */}
              <div className="text-sm space-y-1">
                <div className="truncate">ID: {item.id}</div>
                <div>Category: {item.type}</div>
                <div>Price: {item.price}</div>
                <div>Slot Max: {item.slotMax}</div>
                {item.tradeBlock && <div className="text-red-400">禁止交易</div>}
                {item.notSale && <div className="text-red-400">禁止出售</div>}
                {item.cash && <div className="text-green-400">商城道具</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 