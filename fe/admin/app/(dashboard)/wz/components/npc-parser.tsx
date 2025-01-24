import { useState } from 'react';
import { toast } from 'react-toastify';
import * as mapleWasm from '@/lib/wasm/maple_wasm';
import { getItemName } from '@/lib/wasm/maple_string_pool';

interface NpcData {
  oid: string;
  name: string;
  icon: { stand: string };
}

export function NpcParser() {
  const [formData, setFormData] = useState<NpcData>({
    oid: '',
    name: '',
    icon: { stand: '' },
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
      const npcName = getItemName(oid, 'Npc');

      const info: NpcData = {
        oid: oid,
        name: npcName || oid,
        icon: { stand: parsed.stand[0].canvas },
      };

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
      icon: { stand: '' },
    });
    setCurrentFileName('');
  };

  return (
    <div className="flex gap-6">
      {/* 左侧图片预览 */}
      <div className="w-1/2 pt-4">
        {formData.oid ? (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg relative">
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

            {/* NPC名称 */}
            <div className="text-yellow-400 font-bold mb-4">
              {formData.name}
            </div>

            {/* 站立图片 */}
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${formData.icon.stand}`}
                alt={formData.name}
                className="max-w-full h-auto object-contain"
              />
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
              {/* NPC ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  NPC ID
                </label>
                <input
                  type="text"
                  value={formData.oid}
                  onChange={(e) => setFormData(prev => ({ ...prev, oid: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
                />
              </div>

              {/* NPC名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  NPC Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white"
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
                            category: 'Npc',
                            icon: formData.icon,
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