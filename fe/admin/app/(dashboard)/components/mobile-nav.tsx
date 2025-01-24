import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Home, Package2, PanelLeft, PersonStanding, ShoppingCart, Store, Users2, Database, FileText} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {User} from "./user";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5"/>
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110"/>
            <span className="sr-only">MagicMS</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5"/>
            Dashboard
          </Link>

          <Link
            href="/users"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Users2 className="h-5 w-5"/>
            Users
          </Link>

          <Link
            href="/characters"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <PersonStanding className="h-5 w-5"/>
            Characters
          </Link>

          <Link
            href="/store"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Store className="h-5 w-5"/>
            Store
          </Link>

          <Link
            href="/orders"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart className="h-5 w-5"/>
            Orders
          </Link>

          <Link
            href="/notice"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-5 w-5"/>
            Notice
          </Link>

          <Link
            href="/wz"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Database className="h-5 w-5"/>
            MS Data
          </Link>

          <User/>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
