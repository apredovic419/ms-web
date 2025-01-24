'use client';

import { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initStringPool } from '@/lib/wasm/maple_string_pool';
import { EquipmentParser } from './components/equipment-parser';
import { ItemParser } from './components/item-parser';
import { MobParser } from './components/mob-parser';
import { NpcParser } from './components/npc-parser';
import { MapParser } from './components/map-parser';

export default function WzComponent() {
  useEffect(() => {
    initStringPool();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1.5 rounded-xl gap-2">
          <TabsTrigger 
            value="equipment" 
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          >
            Equipment
          </TabsTrigger>
          <TabsTrigger 
            value="item"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          >
            Item
          </TabsTrigger>
          <TabsTrigger 
            value="mob"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          >
            Mob
          </TabsTrigger>
          <TabsTrigger 
            value="npc"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          >
            NPC
          </TabsTrigger>
          <TabsTrigger 
            value="map"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
          >
            Map
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="equipment">
            <EquipmentParser />
          </TabsContent>

          <TabsContent value="item">
            <ItemParser />
          </TabsContent>

          <TabsContent value="mob">
            <MobParser />
          </TabsContent>

          <TabsContent value="npc">
            <NpcParser />
          </TabsContent>

          <TabsContent value="map">
            <MapParser />
          </TabsContent>

          <TabsContent value="more">
            <div className="text-center text-gray-500 py-8">
              Nothing here yet.
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
