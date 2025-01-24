import React from 'react';
import {DashboardBreadcrumb} from "../components/breadcrumb";
import {MobileNav} from "../components/mobile-nav";

export default function OrderLayout({children}: { children: React.ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <MobileNav/>
        <DashboardBreadcrumb/>
      </header>
      {children}
    </>
  )
}

