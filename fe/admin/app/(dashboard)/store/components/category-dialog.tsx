'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectProductCategory } from "@/lib/db/product-category";
import { useState, useTransition } from "react";
import { useToast } from "@/components/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Loader2, Plus, Trash } from "lucide-react";

interface CategoryDialogProps {
  categories: SelectProductCategory[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleDisplay: (id: number, display: boolean) => Promise<void>;
}

export function CategoryDialog({
  categories,
  isOpen,
  onOpenChange,
  onCreate,
  onDelete,
  onToggleDisplay,
}: CategoryDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Category name cannot be empty",
      });
      return;
    }

    startTransition(async () => {
      try {
        await onCreate(newCategoryName.trim());
        setNewCategoryName("");
        toast({
          description: "Category created successfully",
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          description: "Failed to create category",
        });
      }
    });
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        await onDelete(id);
        toast({
          description: "Category deleted successfully",
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          description: "Failed to delete category",
        });
      }
    });
  };

  const handleToggleDisplay = (id: number, currentDisplay: boolean) => {
    startTransition(async () => {
      try {
        await onToggleDisplay(id, !currentDisplay);
        toast({
          description: `Category ${!currentDisplay ? "shown" : "hidden"} successfully`,
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          description: `Failed to ${!currentDisplay ? "show" : "hide"} category`,
        });
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Category Management</DialogTitle>
            <DialogDescription>
              Manage product categories: add, delete, show or hide categories
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter new category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newCategoryName.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ml-2">Add</span>
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      {category.display ? (
                        <span className="text-green-600">Visible</span>
                      ) : (
                        <span className="text-gray-400">Hidden</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggleDisplay(category.id, category.display)
                        }
                        disabled={isPending}
                      >
                        {category.display ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this category? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category.id)}>
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 