import React from "react";
import Link from "next/link";
import {MsLogo} from "@/components/icons";
import {NavItem} from "./nav-item";
import {Home, PersonStanding, ShoppingCart, Store, Users2, Database, FileText} from "lucide-react";
import {User} from "./user";

export function DesktopNav() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-red-500 text-lg font-semibold text-white md:h-8 md:w-8 md:text-base hover:bg-red-700 hover:scale-105 transition-all"
        >
          <MsLogo className="h-6 w-6" />
          <span className="sr-only">MagicMS</span>
        </Link>

        <NavItem href="/" label="Dashboard">
          <Home className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/users" label="Users">
          <Users2 className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/characters" label="Characters">
          <PersonStanding className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/store" label="Store">
          <Store className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/orders" label="Orders">
          <ShoppingCart className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/notice" label="Notice">
          <FileText className="h-5 w-5"/>
        </NavItem>

        <NavItem href="/wz" label="MS Data">
          <Database className="h-5 w-5"/>
        </NavItem>

      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <User/>
      </nav>
    </aside>
  );
}