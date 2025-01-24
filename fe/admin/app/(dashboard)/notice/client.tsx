"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NoticeDialog } from "./components/notice-dialog";
import { notice } from "@/lib/db/schema";
import { toast } from 'react-toastify';
import { DeleteAlert } from "./components/delete-alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, FileEdit, FileText, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoticeContent } from "./components/notice-content";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import React from "react";

type Notice = typeof notice.$inferSelect;

const PAGE_SIZE = 6;

export function NoticesClient() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNotices, setExpandedNotices] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/notice");
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
      setNotices(data);
    } catch (error) {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notice: Notice) => {
    setNoticeToDelete(notice);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!noticeToDelete) return;
    
    try {
      const response = await fetch(`/api/notice/${noticeToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notice");
      toast.success("Successfully deleted");
      await fetchNotices();
    } catch (error) {
      toast.error("Failed to delete notice");
    }
  };

  const handleToggleDisplay = async (notice: Notice) => {
    try {
      const response = await fetch(`/api/notice/${notice.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display: !notice.display,
        }),
      });
      if (!response.ok) throw new Error("Failed to update notice status");
      toast.success("Successfully updated");
      await fetchNotices();
    } catch (error) {
      toast.error("Failed to update notice status");
    }
  };

  const handleToggleVisit = async (notice: Notice) => {
    try {
      const response = await fetch(`/api/notice/${notice.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit: !notice.visit,
        }),
      });
      if (!response.ok) throw new Error("Failed to update notice status");
      toast.success("Successfully updated");
      await fetchNotices();
    } catch (error) {
      toast.error("Failed to update notice status");
    }
  };

  const toggleExpand = (noticeId: number) => {
    setExpandedNotices((prev) => {
      const next = new Set(prev);
      if (next.has(noticeId)) {
        next.delete(noticeId);
      } else {
        next.add(noticeId);
      }
      return next;
    });
  };

  const totalPages = Math.ceil(notices.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentNotices = notices.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notice Management</CardTitle>
              <CardDescription>Manage website announcements and notifications</CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedNotice(null);
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Notice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>No notices available</p>
              <p className="text-sm">Click the button in the top right to add a new notice</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentNotices.map((notice) => (
                    <React.Fragment key={notice.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleExpand(notice.id)}
                      >
                        <TableCell className="font-medium">{notice.title}</TableCell>
                        <TableCell>
                          {new Date(notice.createTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={notice.display ? "default" : "secondary"}>
                              {notice.display ? "Visible" : "Hidden"}
                            </Badge>
                            <Badge variant={notice.visit ? "default" : "secondary"}>
                              {notice.visit ? "Accessible" : "Restricted"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDisplay(notice);
                              }}
                              title={notice.display ? "Click to hide" : "Click to show"}
                            >
                              {notice.display ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotice(notice);
                                setIsDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notice);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <NoticeContent
                            content={notice.content}
                            expanded={expandedNotices.has(notice.id)}
                            onToggle={() => toggleExpand(notice.id)}
                          />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <NoticeDialog
        notice={selectedNotice}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false);
          fetchNotices();
        }}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={confirmDelete}
        title={noticeToDelete?.title}
      />
    </div>
  );
} 