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
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {CalendarIcon, ChevronDown, Copy, MoreHorizontal} from "lucide-react";
import {toast} from "react-toastify";
import {format} from "date-fns";

import {Calendar} from "@/components/ui/calendar"
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {SelectAccount} from "@/lib/db/account";
import {cn} from "@/lib/utils";


const LoginStatus: { [key: number]: string } = {
  0: "offline",
  1: "logging",
  2: "online",
}

const Language: { [key: number]: string } = {
  0: "English",
  2: "Chinese",
}

const truncateString = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + "...";
  }
  return str;
}

const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

interface ShowPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password?: string;
}

const ShowPasswordModal: React.FC<ShowPasswordModalProps> = ({isOpen, onClose, password}) => {
  if (!isOpen || !password) {
    return null;
  }
  const handleCopyToClipboard = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(password);
        toast.success('Password copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy password to clipboard, please copy manually');
      }
    } else {
      toast.error('Failed to copy password to clipboard, please copy manually');
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Password</DialogTitle>
          <DialogDescription>
            Please copy the new password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="gap-2 flex items-center">
            <Input value={password} readOnly className="flex-1"
                   onDoubleClick={handleCopyToClipboard}/>
            <Button type="button" onClick={handleCopyToClipboard} size="sm">
              <Copy className="h-4 w-4"/>
              <span className="sr-only">Copy Password</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


interface BanAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SelectAccount;
  data: SelectAccount[];
  setData: any;
}

const BanAccountDialog: React.FC<BanAccountModalProps> = (
  {
    isOpen,
    onClose,
    user,
    data,
    setData
  }
) => {
  const [banReason, setBanReason] = React.useState("");

  const updateTable = () => {
    const updatedData = data.map((item) => {
      if (item.id === user.id) {
        return {
          ...item,
          banned: item.banned ^ 1,
          banreason: banReason,
        }
      }
      return item;
    })
    setData(updatedData);
  };

  const handleBanAccount = async () => {
    console.log(
      `Ban account ${user.id} with reason: ${banReason}`,
      user.banned === 1 ? "Unban" : "Ban"
    );
    onClose();
    fetch(`/users/${user.id}/banned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: user.banned === 1 ? 'unban' : 'ban',
        reason: banReason,
      }),
    }).then(
      (response) => {
        if (response.ok) {
          updateTable();
          toast.success(`Account ${user.banned === 1 ? 'unbanned' : 'banned'} successfully!`);
        } else {
          toast.error(`Failed to ${user.banned === 1 ? 'unban' : 'ban'} account.`);
        }
      },
      (error) => {
        toast.error(`Failed to ${user.banned === 1 ? 'unban' : 'ban'} account.`);
      }
    ).catch((error) => {
      toast.error(`Failed to ${user.banned === 1 ? 'unban' : 'ban'} account.`);
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user.banned === 1 ? "Unban" : "Ban"} Account
          </DialogTitle>
          <DialogDescription>
            {user.banned === 1
              ? "Are you sure you want to unban this account?"
              : "Please provide a reason for banning this account."}
          </DialogDescription>
        </DialogHeader>
        {user.banned === 0 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="banReason">Ban Reason</Label>
              <Input
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBanAccount}
            disabled={user.banned === 0 && !banReason}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SelectAccount;
  data: SelectAccount[];
  setData: (data: any[]) => void;
}

const EditAccountDialog: React.FC<EditAccountModalProps> = (
  {
    isOpen,
    onClose,
    user,
    data,
    setData
  }
) => {
  const [name, setName] = React.useState(user.name);
  const [email, setEmail] = React.useState(user.email || '');
  const [birthDate, setBirthDate] = React.useState<Date | undefined>(user.birthday ? new Date(user.birthday) : undefined);
  const [nx, setNx] = React.useState(user.nxCredit || 0);
  const [np, setNp] = React.useState(user.nxPrepaid || 0);
  const [mp, setMp] = React.useState(user.maplePoint || 0);
  const [rp, setRp] = React.useState(user.rewardpoints || 0);
  const [vp, setVp] = React.useState(user.votepoints || 0);
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    nx?: string;
    np?: string;
    mp?: string;
    rp?: string;
    vp?: string;
  }>({});
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email || '');
      setNx(user.nxCredit || 0);
      setNp(user.nxPrepaid || 0);
      setMp(user.maplePoint || 0);
      setRp(user.rewardpoints);
      setVp(user.votepoints);
      setErrors({}); // Clear errors on user change
    }
  }, [user]);
  const validateForm = () => {
    let isValid = true;
    const newErrors: any = {};
    //name
    if (name.length < 3 || name.length > 13) {
      newErrors.name = 'Name length must between 4 and 12'
      isValid = false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
      newErrors.name = 'Name can only contain letter and numbers'
      isValid = false;
    }
    //email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }
    //nx
    if (nx < 0 || !/^\d+$/.test(String(nx))) {
      newErrors.nx = 'Nx must be greater than or equal to 0';
      isValid = false;
    }
    //np
    if (np < 0 || !/^\d+$/.test(String(np))) {
      newErrors.np = 'Np must be greater than or equal to 0';
      isValid = false;
    }
    //mp
    if (mp < 0 || !/^\d+$/.test(String(mp))) {
      newErrors.mp = 'Mp must be greater than or equal to 0';
      isValid = false;
    }
    //rp
    if (rp < 0 || !/^\d+$/.test(String(rp))) {
      newErrors.rp = 'Rp must be greater than or equal to 0';
      isValid = false;
    }
    //vp
    if (vp < 0 || !/^\d+$/.test(String(vp))) {
      newErrors.vp = 'Vp must be greater than or equal to 0';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  const handleConfirmAction = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      onClose();
      setConfirmOpen(false);
      const response = await fetch(`/users/${user.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          birthday: birthDate ? format(birthDate, "yyyy-MM-dd") : '2022-09-01',
          nxCredit: nx,
          nxPrepaid: np,
          maplePoint: mp,
          rewardpoints: rp,
          votepoints: vp
        }),
      });

      if (response.ok) {
        const updatedUser = {
          ...user,
          name,
          email,
          birthday: birthDate,
          nxCredit: nx,
          nxPrepaid: np,
          maplePoint: mp,
          rewardpoints: rp,
          votepoints: vp
        };
        const updatedData = data.map(item => item.id === user.id ? updatedUser : item);
        setData(updatedData);
        toast.success('Account updated successfully!');
      } else {
        toast.error('Failed to update account.');
      }
    } catch (error) {
      toast.error('Failed to update account.');
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Edit the details of this account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Birth Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4"/>
                    {birthDate ? format(birthDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    captionLayout="dropdown-buttons"
                    fromYear={1925}
                    toYear={new Date().getFullYear()}
                    className="rounded-md border pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nx">NX</Label>
              <Input
                id="nx"
                type="number"
                value={nx || 0}
                onChange={(e) => setNx(Number(e.target.value))}
                aria-invalid={!!errors.nx}
              />
              {errors.nx && <p className="text-red-500 text-sm">{errors.nx}</p>}
            </div>
            <div className="flex space-x-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="np">NP</Label>
                <Input
                  id="np"
                  type="number"
                  value={np}
                  onChange={(e) => setNp(Number(e.target.value))}
                  aria-invalid={!!errors.np}
                />
                {errors.np && <p className="text-red-500 text-sm">{errors.np}</p>}
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="mp">MP</Label>
                <Input
                  id="mp"
                  type="number"
                  value={mp}
                  onChange={(e) => setMp(Number(e.target.value))}
                  aria-invalid={!!errors.mp}
                />
                {errors.mp && <p className="text-red-500 text-sm">{errors.mp}</p>}
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="rp">RP</Label>
                <Input
                  id="rp"
                  type="number"
                  value={rp}
                  onChange={(e) => setRp(Number(e.target.value))}
                  aria-invalid={!!errors.rp}
                />
                {errors.rp && <p className="text-red-500 text-sm">{errors.rp}</p>}
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="vp">VP</Label>
                <Input
                  id="vp"
                  type="number"
                  value={vp}
                  onChange={(e) => setVp(Number(e.target.value))}
                  aria-invalid={!!errors.vp}
                />
                {errors.vp && <p className="text-red-500 text-sm">{errors.vp}</p>}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {user.loggedin > 0 ? (
              <Button type="button" onClick={() => setConfirmOpen(true)}>
                Confirm
              </Button>
            ) : (
              <Button type="button" onClick={handleConfirmAction}>
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This user is currently online.
                Modifying this user might cause some unexpected errors.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirmAction}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Dialog>
    </>
  );
};


interface CreateAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  setData: (data: any[]) => void;
}

const CreateAccountDialog: React.FC<CreateAccountDialogProps> = (
  {
    isOpen,
    onClose,
    data,
    setData
  }
) => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [birthDate, setBirthDate] = React.useState<Date | undefined>(new Date())
  const [errors, setErrors] = React.useState<{
    username?: string;
    email?: string;
    birthDate?: string;
  }>({});
  const [newPassword, setNewPassword] = React.useState<string | undefined>(undefined);
  const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors: any = {};
    if (username.length < 4 || username.length > 12) {
      newErrors.username = 'Username length must between 4 and 12'
      isValid = false;
    }
    //email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }
    if (!birthDate) {
      newErrors.birthDate = 'Birth date is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  }


  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }
    const password = generateRandomPassword();
    try {
      const response = await fetch(`/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          password,
          email,
          birthday: birthDate ? format(birthDate, "yyyy-MM-dd") : undefined,
        }),
      });
      if (response.ok) {
        const resp = await response.json();
        setData([resp.data, ...data]);
        toast.success('Account created successfully!');
        setNewPassword(password);
        setPasswordModalOpen(true);
      } else {
        try {
          const resp = await response.json();
          const message = resp.message as string;
          toast.error(`Failed to create account: ${message}`);
        } catch (_) {
          toast.error('Failed to create account.');
        }
      }
    } catch (error) {
      toast.error('Failed to create account.');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Create a new account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
            />
            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Birth Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4"/>
                  {birthDate ? format(birthDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  captionLayout="dropdown-buttons"
                  fromYear={1925}
                  toYear={new Date().getFullYear()}
                  className="rounded-md border pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.birthDate && <p className="text-red-500 text-sm">{errors.birthDate}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCreateAccount}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
      <ShowPasswordModal isOpen={passwordModalOpen} onClose={() => {
        setPasswordModalOpen(false);
        onClose();
      }} password={newPassword}/>
    </Dialog>
  );
};

export function DataTable({accounts}: { accounts: SelectAccount[] }) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      password: false,
      pin: false,
      pic: false,
      birthday: false,
      banreason: false,
      macs: false,
      characterslots: false,
      gender: false,
      tempban: false,
      greason: false,
      tos: false,
      sitelogged: false,
      webadmin: false,
      nick: false,
      mute: false,
      ip: false,
      rewardpoints: false,
      votepoints: false,
      hwid: false,
      language: false,
    })
  const [rowSelection, setRowSelection] = React.useState({})
  const [data, setData] = React.useState(accounts)

  const columns: ColumnDef<SelectAccount>[] = [
    {
      id: "select",
      header: ({table}) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({row}) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Username",
      cell: ({row}) => <div className="lowercase">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({row}) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "birthday",
      header: "Birthday",
      cell: ({row}) => <div
        className="lowercase">{format(row.getValue("birthday"), "yyyy-MM-dd")}</div>,
    },
    {
      accessorKey: "loggedin",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Login Status
          </Button>
        )
      },
      cell: ({row}) => (
        <div className="capitalize">{LoginStatus[row.getValue("loggedin") as number]}</div>
      ),
    },
    {
      accessorKey: "banned",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Banned
          </Button>
        )
      },
      cell: ({row}) => (
        <div className="capitalize">
          {row.getValue("banned") === 1 && <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>{truncateString(row.getValue('banreason') || "Y", 5)}</TooltipTrigger>
              <TooltipContent>
                <p>{row.getValue('banreason')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}
        </div>
      ),
    },
    {
      accessorKey: "banreason",
      header: "Ban Reason",
      cell: ({row}) => <div className="lowercase">{row.getValue("banreason")}</div>,
    },
    {
      accessorKey: "nxCredit",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              NX
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{formatNumber(row.getValue("nxCredit"))}</div>
      },
    },
    {
      accessorKey: "nxPrepaid",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              NP
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{formatNumber(row.getValue("nxPrepaid"))}</div>
      },
    },
    {
      accessorKey: "maplePoint",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              MP
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{formatNumber(row.getValue("maplePoint"))}</div>
      },
    },
    {
      accessorKey: "rewardpoints",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              RP
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{formatNumber(row.getValue("rewardpoints"))}</div>
      },
    },
    {
      accessorKey: "votepoints",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              VP
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{formatNumber(row.getValue("votepoints"))}</div>
      },
    },
    {
      accessorKey: "ip",
      header: "IP",
      cell: ({row}) => <div className="lowercase">{row.getValue("ip")}</div>,
    },
    {
      accessorKey: "hwid",
      header: "Hwid",
      cell: ({row}) => <div className="lowercase">{row.getValue("hwid")}</div>,
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({row}) => <div
        className="capitalize">{Language[row.getValue("language") as number]}</div>,
    },
    {
      accessorKey: "lastlogin",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Last Login
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return (
          <div className="text-right font-medium">
            {row.getValue("lastlogin") ? format(row.getValue("lastlogin"), "yyyy-MM-dd hh:mm:ss") : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "createdat",
      header: ({column}) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Created At
            </Button>
          </div>
        )
      },
      cell: ({row}) => {
        return <div
          className="text-right font-medium">{format(row.getValue("createdat"), "yyyy-MM-dd hh:mm:ss")}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({row}) => {
        const [user, setUser] = React.useState(row.original);
        const [banDialogOpen, setBanDialogOpen] = React.useState(false);
        const [editDialogOpen, setEditDialogOpen] = React.useState(false);
        const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = React.useState(false);
        const [resetPasswordType, setResetPasswordType] = React.useState<"random" | "custom">("random");
        const [customPassword, setCustomPassword] = React.useState("");
        const [newPassword, setNewPassword] = React.useState<string | undefined>(undefined);
        const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);
        const [webAdminDialogOpen, setWebAdminDialogOpen] = React.useState(false);

        const handleResetPassword = async () => {
          console.log(
            `Reset password for account ${user.id} with type: ${resetPasswordType} ${
              resetPasswordType === "custom" ? `and custom password: ${customPassword}` : ""
            }`
          );
          setResetPasswordDialogOpen(false);
          let passwordToUse: string | undefined = customPassword;

          if (resetPasswordType === "random") {
            passwordToUse = generateRandomPassword();
          }

          fetch(`/users/${user.id}/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              password: passwordToUse,
            }),
          })
            .then(async (response) => {
              if (response.ok) {
                if (passwordToUse) {
                  if (resetPasswordType === 'random') {
                    setNewPassword(passwordToUse);
                    setPasswordModalOpen(true);
                  }
                }
                toast.success(`Password reset successfully!`);
              } else {
                toast.error(`Failed to reset password.`);
              }
            })
            .catch((error) => {
              toast.error(`Failed to reset password.`);
            });
        };

        const handleWebAdminChange = async () => {
          console.log(
            `Change WebAdmin status for account ${user.id} to: ${user.webadmin === null || user.webadmin < 1 ? "grant" : "revoke"}`
          );
          setWebAdminDialogOpen(false);
          fetch(`/users/${user.id}/webadmin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: user.webadmin === null || user.webadmin < 1 ? 'grant' : 'revoke',
            }),
          })
            .then(async (response) => {
              if (response.ok) {
                const updatedUser = {
                  ...user,
                  webadmin: user.webadmin === null || user.webadmin < 1 ? 1 : null,
                };
                const updatedData = data.map(item => item.id === user.id ? updatedUser : item);
                setData(updatedData);
                toast.success(`WebAdmin privileges for account ${user.id} updated successfully!`);
              } else {
                toast.error(`Failed to update WebAdmin privileges for account ${user.id}.`);
              }
            })
            .catch((error) => {
              toast.error(`Failed to update WebAdmin privileges for account ${user.id}.`);
            });
        };

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
                    navigator.clipboard.writeText(user.id.toString()).then(() => {
                      toast.success(`Account ID ${user.id} copied to clipboard!`);
                    }).catch(() => {
                      toast.error('Failed to copy account ID to clipboard, please copy manually');
                    });
                  } else {
                    toast.error(`Failed to copy account ID ${user.id} to clipboard`);
                  }
                }}
              >
                Copy Account ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setWebAdminDialogOpen(true)}>
                {user.webadmin === null || user.webadmin < 1 ? "Grant" : "Revoke"} WebAdmin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                Edit Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
                {user.banned === 1 ? "Unban" : "Ban"} Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setResetPasswordDialogOpen(true)}>
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={() => location.href = `/characters?accountId=${user.id}`}>View
                Characters</DropdownMenuItem>
              <DropdownMenuItem onClick={() => location.href = `/orders?accountId=${user.id}`}>View
                Orders</DropdownMenuItem>
            </DropdownMenuContent>
            <EditAccountDialog
              isOpen={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              user={user}
              data={data}
              setData={setData}
            />
            <BanAccountDialog
              isOpen={banDialogOpen}
              onClose={() => setBanDialogOpen(false)}
              user={user}
              data={data}
              setData={setData}
            />
            <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Choose how to reset the password for this account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="randomPassword"
                      name="resetPasswordType"
                      value="random"
                      checked={resetPasswordType === "random"}
                      onChange={() => setResetPasswordType("random")}
                    />
                    <Label htmlFor="randomPassword">Generate Random Password</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="customPassword"
                      name="resetPasswordType"
                      value="custom"
                      checked={resetPasswordType === "custom"}
                      onChange={() => setResetPasswordType("custom")}
                    />
                    <Label htmlFor="customPassword">Set Custom Password</Label>
                  </div>
                  {resetPasswordType === "custom" && (
                    <div className="grid gap-2">
                      <Label htmlFor="customPasswordInput">Custom Password</Label>
                      <Input
                        id="customPasswordInput"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary"
                          onClick={() => setResetPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleResetPassword}
                          disabled={resetPasswordType === 'custom' && !customPassword}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ShowPasswordModal isOpen={passwordModalOpen}
                               onClose={() => setPasswordModalOpen(false)}
                               password={newPassword}/>
            <Dialog open={webAdminDialogOpen} onOpenChange={setWebAdminDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{user.webadmin === null || user.webadmin < 1 ? "Grant" : "Revoke"} WebAdmin</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to {user.webadmin === null || user.webadmin < 1 ? "grant" : "revoke"} WebAdmin privileges for this account?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setWebAdminDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleWebAdminChange}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenu>
        )
      },
    },
  ]

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
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true; // 如果没有过滤值，返回 true (显示所有行)
      const filterText = String(filterValue).toLowerCase();
      const name = String(row.getValue("name")).toLowerCase();
      const email = String(row.getValue("email") || '').toLowerCase();
      const ip = String(row.getValue("ip") || '').toLowerCase();
      const hwid = String(row.getValue("hwid") || '').toLowerCase();
      const banReason = String(row.getValue("banreason") || '').toLowerCase();
      const text = ''.concat(name, email, ip, hwid, banReason);

      return text.includes(filterText);
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <div className="flex items-center">
          <Input
            placeholder="Filter username or email..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" className="ml-2" onClick={() => setCreateDialogOpen(true)}>
            Create Account
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <CreateAccountDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        data={data}
        setData={setData}
      />
    </div>
  )
}