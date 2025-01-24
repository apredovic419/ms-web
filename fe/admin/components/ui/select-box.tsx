'use client';

import {Listbox, ListboxButton, ListboxOption, ListboxOptions} from "@headlessui/react";
import {CheckIcon, ChevronsDownUpIcon} from "lucide-react";
import React from "react";


export default function SelectBox(
  {inputName, items, selected: externalSelected, setSelected: externalSetSelected, ...props}:
  {
    inputName: string,
    items: { id: any, name: string, [key: string]: any }[],
    selected?: { id: any, name: string },
    setSelected?: (item: { id: any, name: string }) => void,
    [key: string]: any
  }
) {
  if (items.length === 0) {
    items.push({id: 0, name: 'Not found'});
  }
  const [internalSelected, internalSetSelected] = React.useState(items[0]);
  const selected = externalSelected ?? internalSelected;
  const setSelected = externalSetSelected ?? internalSetSelected;

  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative mt-2">
        <ListboxButton
          className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
              <img alt="" className="size-5 shrink-0 rounded-full"/>
              <span>{selected.name}</span>
              </span>
          <ChevronsDownUpIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
        >
          {items.map((item) => (
            <ListboxOption
              key={item.id}
              value={item}
              className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-none"
            >
              {/*<div className="flex items-center">*/}
              {/*<img alt="" src={category.avatar} className="size-5 shrink-0 rounded-full"/>*/}
              <span
                className="ml-3 block truncate font-normal group-data-[selected]:font-semibold">
                  {item.name}
                </span>
              {/*</div>*/}
              <span
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-[&:not([data-selected])]:hidden group-data-[focus]:text-white">
                <CheckIcon aria-hidden="true" className="size-5"/>
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
      <input
        type="hidden"
        name={inputName}
        value={selected.id}
        {...props}
      />
    </Listbox>
  )
}