import {Metadata} from "next";
import {OrderDataTable} from "./data-table";
import {FilterForm} from "./filter-form";
import {Suspense} from "react";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function OrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
      </div>
      <div className="space-y-4">
        <Suspense fallback={<div>Loading filters...</div>}>
          <FilterForm/>
        </Suspense>
        <Suspense fallback={<div>Loading orders...</div>}>
          <OrderDataTable/>
        </Suspense>
      </div>
    </div>
  );
} 