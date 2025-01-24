"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notice } from "@/lib/db/schema";
import { useForm } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { FileText, Eye, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeFormData = {
  title: string;
  content: string;
  display: boolean;
  visit: boolean;
};

type Props = {
  notice?: typeof notice.$inferSelect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function NoticeDialog({ notice, open, onOpenChange, onSuccess }: Props) {
  const [content, setContent] = useState(notice?.content || "");
  const { register, handleSubmit, reset, watch, setValue } = useForm<NoticeFormData>({
    defaultValues: {
      title: notice?.title || "",
      content: notice?.content || "",
      display: notice?.display ? Boolean(notice.display) : true,
      visit: notice?.visit ? Boolean(notice.visit) : true,
    },
  });

  const displayValue = watch("display");
  const visitValue = watch("visit");

  useEffect(() => {
    setContent(notice?.content || "");
  }, [notice]);

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        content: "",
        display: true,
        visit: true,
      });
      setContent("");
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    } else if (notice) {
      reset({
        title: notice.title,
        content: notice.content,
        display: Boolean(notice.display),
        visit: Boolean(notice.visit),
      });
      setContent(notice.content);
    }
  }, [open, notice, reset]);

  const onSubmit = async (data: NoticeFormData) => {
    try {
      const url = notice ? `/api/notice/${notice.id}` : "/api/notice";
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          content,
          display: Number(data.display),
          visit: Number(data.visit),
        }),
      });

      if (!response.ok) {
        throw new Error(notice ? "Failed to update notice" : "Failed to create notice");
      }

      toast.success(notice ? "Successfully updated" : "Successfully created");
      reset();
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {notice ? "Edit Notice" : "Create Notice"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                {...register("title", { required: true })}
                placeholder="Please enter the title "
                className="h-10"
              />
            </div>

            <div className="grid w-full items-center gap-1.5" data-color-mode="light">
              <Label htmlFor="content">Content</Label>
              <div className="rounded-md border">
                <MDEditor
                  value={content}
                  onChange={(value: string | undefined) => setContent(value || "")}
                  preview="edit"
                  height={400}
                  className="border-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="display"
                  checked={displayValue}
                  onCheckedChange={(checked: boolean) => setValue("display", checked)}
                />
                <Label htmlFor="display" className="flex items-center gap-1.5">
                  <Eye className={cn(
                    "h-4 w-4 transition-colors",
                    displayValue ? "text-primary" : "text-muted-foreground"
                  )} />
                  Visible
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="visit"
                  checked={visitValue}
                  onCheckedChange={(checked: boolean) => setValue("visit", checked)}
                />
                <Label htmlFor="visit" className="flex items-center gap-1.5">
                  <Globe className={cn(
                    "h-4 w-4 transition-colors",
                    visitValue ? "text-primary" : "text-muted-foreground"
                  )} />
                  Accessible
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {notice ? "Save Changes" : "Create Notice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 