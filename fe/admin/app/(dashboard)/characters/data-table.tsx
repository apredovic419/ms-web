'use client'

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {ChevronLeft, ChevronRight, MoreHorizontal} from "lucide-react";
import {toast} from "react-toastify";
import {format} from "date-fns";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {CharacterWithRelations} from "@/lib/db/character";
import {JobName} from "@/lib/definitions";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {InventoryDialog} from "./inventory-dialog";
import {initStringPool, getItemName} from "@/lib/wasm/maple_string_pool";


const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function characterAvatarUrl(character: CharacterWithRelations): string {
  let url = "https://maplestory.io/api/character/";
  let itemsStr: string[] = [];
  itemsStr.push(`{"itemId":${character.hair},"version":"253"}`);
  itemsStr.push(`{"itemId":${character.face},"version":"253"}`);
  itemsStr.push(`{"itemId":200${character.skinColor},"version":"253"}`);
  itemsStr.push(`{"itemId":1200${character.skinColor},"version":"253"}`);
  character.items?.filter(item => item.position < 0)
    .forEach(item => {
      itemsStr.push(`{"itemId":${item.itemId},"version":"253"}`);
    })
  const itemsUri = encodeURIComponent(itemsStr.join(",").replace(/\s/g, ""));
  url += itemsUri;
  return url;
}

function ExpandedRow({row}: { row: Row<CharacterWithRelations> }) {
  const character = row.original;
  return (
    <div className="p-6 border-b">
      <div className="flex gap-6">
        <div
          className="w-32 h-32 border rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-50">
          <img
            src={characterAvatarUrl(character)}
            alt="Character Avatar"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Attributes</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">STR</span>
                <span className="font-medium">{character.str}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">DEX</span>
                <span className="font-medium">{character.dex}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">INT</span>
                <span className="font-medium">{character.int}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">LUK</span>
                <span className="font-medium">{character.luk}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">HP</span>
                <span className="font-medium">{character.hp} / {character.maxHp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">MP</span>
                <span className="font-medium">{character.mp} / {character.maxMp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Mesos</span>
                <span className="font-medium">{formatNumber(character.meso)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Fame</span>
                <span className="font-medium">{character.fame}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Game Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Map</span>
                <span className="font-medium">{getItemName(character.map.toString(), 'Map')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">AP Points</span>
                <span className="font-medium">{character.ap}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Dojo Points</span>
                <span className="font-medium">{character.dojoPoints}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">GM Level</span>
                <span className="font-medium">{character.gm}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Rankings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Overall Rank</span>
                <span className="font-medium">{character.rank}</span>
                <span
                  className="text-xs text-gray-400">({character.rankMove > 0 ? '+' : ''}{character.rankMove})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Job Rank</span>
                <span className="font-medium">{character.jobRank}</span>
                <span
                  className="text-xs text-gray-400">({character.jobRankMove > 0 ? '+' : ''}{character.jobRankMove})</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Inventory</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Equip Slots</span>
                <span className="font-medium">{character.equipSlots}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Use Slots</span>
                <span className="font-medium">{character.useSlots}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Setup Slots</span>
                <span className="font-medium">{character.setupSlots}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Etc Slots</span>
                <span className="font-medium">{character.etcSlots}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Time Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Created At</span>
                <span
                  className="font-medium">{format(new Date(character.createDate), 'yyyy-MM-dd HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Last Logout</span>
                <span className="font-medium">
                  {character.lastLogoutTime ? format(new Date(character.lastLogoutTime), 'yyyy-MM-dd HH:mm') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Last EXP Gain</span>
                <span className="font-medium">
                  {character.lastExpGainTime ? format(new Date(character.lastExpGainTime), 'yyyy-MM-dd HH:mm') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Jail Expire</span>
                <span className="font-medium">
                  {character.lastExpGainTime ? format(new Date(character.jailExpire), 'yyyy-MM-dd HH:mm') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function DataTable({characters, nextOffset}: {
  characters: CharacterWithRelations[],
  nextOffset: number
}) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [data, setData] = React.useState(characters)
  const [inventoryOpen, setInventoryOpen] = React.useState(false);
  const [selectedCharacter, setSelectedCharacter] = React.useState<CharacterWithRelations | null>(null);

  let router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();

  React.useEffect(() => {
    setData(characters);
    initStringPool();
  }, [characters]);

  function prevPage() {
    router.back();
  }

  function nextPage() {
    const params = new URLSearchParams(searchParams);
    params.set('offset', nextOffset.toString());
    router.push(`${pathName}?${params.toString()}`, {scroll: false})
  }

  const columns: ColumnDef<CharacterWithRelations>[] = [
    // {
    //   id: "select",
    //   header: ({table}) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({row}) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "account.name",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Account
          </Button>
        )
      },
      cell: ({row}) => {
        const loginStatus = row.original.account?.loggedin;
        let color = "gray";
        let statusText = "Offline";
        if (loginStatus === 1) {
          color = "orange";
          statusText = "Logging";
        } else if (loginStatus === 2) {
          color = "green";
          statusText = "Online"
        }
        return (
          <div style={{display: 'flex', alignItems: 'center'}} title={statusText}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                marginRight: '5px',
              }}
            />
            <span>{row.original.account?.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "name",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
          </Button>
        )
      },
      cell: ({row}) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "level",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Level
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{row.getValue("level")}</div>
      },
    },
    {
      accessorKey: "job",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Job
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{JobName[row.getValue("job") as number]}</div>
      },
    },
    {
      accessorKey: "guild.name",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Guild
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{row.original.guild?.name}</div>
      },
    },
    {
      accessorKey: "meso",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Meso
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{formatNumber(row.getValue("meso"))}</div>
      },
    },
    {
      accessorKey: "rank",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rank
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{row.getValue("rank")}</div>
      },
    },
    {
      accessorKey: "jobRank",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Job Rank
          </Button>
        )
      },
      cell: ({row}) => {
        return <div className="font-medium">{row.getValue("jobRank")}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({row}) => {
        const [character, setCharacter] = React.useState(row.original);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(character.id.toString()).then(() => {
                      toast.success(`Character ID ${character.id} copied to clipboard!`);
                    }).catch(() => {
                      toast.error('Failed to copy character ID to clipboard, please copy manually');
                    });
                  } else {
                    toast.error(`Failed to copy Character ID ${character.id} to clipboard`);
                  }
                }}
              >
                Copy Character ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText((character.account?.id || 0).toString()).then(() => {
                      toast.success(`Account ID ${character.account?.id} copied to clipboard!`);
                    }).catch(() => {
                      toast.error('Failed to copy account ID to clipboard, please copy manually');
                    });
                  } else {
                    toast.error(`Failed to copy Account ID ${character.account?.id} to clipboard`);
                  }
                }}
              >
                Copy Account ID
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={() => {
                setSelectedCharacter(character);
                setInventoryOpen(true);
              }}>
                View Items
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => location.href = `/orders?characterId=${character.id}`}>View
                Orders</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleClickRow = (row: Row<CharacterWithRelations>) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(row.original.id)) {
        newSet.delete(row.original.id);
      } else {
        newSet.add(row.original.id);
      }
      return newSet;
    });
  };

  const table = useReactTable({
    data: data,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => handleClickRow(row)}
                    style={{cursor: 'pointer'}}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has(row.original.id) && (
                    <tr>
                      <td colSpan={columns.length} style={{padding: 0}}>
                        <ExpandedRow row={row}/>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex">
          <Button
            onClick={prevPage}
            variant="ghost"
            size="sm"
            type="submit"
          >
            <ChevronLeft className="mr-2 h-4 w-4"/>
            Prev
          </Button>
          <Button
            onClick={nextPage}
            variant="ghost"
            size="sm"
            type="submit"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4"/>
          </Button>
        </div>
      </div>
      {selectedCharacter && (
        <InventoryDialog
          open={inventoryOpen}
          onOpenChange={setInventoryOpen}
          character={selectedCharacter}
        />
      )}
    </div>
  )
}