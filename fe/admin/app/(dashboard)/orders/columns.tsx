import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {formatDateTime} from "@/lib/utils";
import {ArrowUpDown} from "lucide-react";
import {Button} from "@/components/ui/button";
import i18n from "@/lib/i18n";

const t = i18n.t;

export type ShoppingLog = {
  id: number;
  character: string;
  gift: {
    type: string;
    data: number[];
  };
  shopId: number;
  shopName: string;
  count: number;
  price: number;
  currency: string;
  limitGroup: string | null;
  createTime: string;
}

export function getColumns(): ColumnDef<ShoppingLog>[] {
  return [
    {
      accessorKey: "character",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.character')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "gift",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.gift')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
      cell: ({row}) => {
        const gift = row.getValue("gift") as { type: string; data: number[] };
        const isGift = gift?.data?.[0] === 1;
        return (
          <Badge variant={isGift ? "default" : "secondary"}>
            {isGift ? t('orders.table.giftYes') : t('orders.table.giftNo')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "shopId",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.shopId')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "shopName",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.shopName')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "count",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.count')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.price')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "currency",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.currency')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
    },
    {
      accessorKey: "limitGroup",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.limitGroup')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
      cell: ({row}) => {
        const limitGroup = row.getValue("limitGroup") as string | null;
        return limitGroup || "-";
      },
    },
    {
      accessorKey: "createTime",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('orders.table.createTime')}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        );
      },
      cell: ({row}) => {
        const createTime = row.getValue("createTime") as string;
        return formatDateTime(createTime);
      },
    },
  ];
} 