"use client";
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
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns } from "@/components/user-files/columns";
import { DataTable } from "@/components/user-files/data-table";

type userFile = {
  id: string;
  userId: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
};

const UserFilesTable = () => {
  const mockFiles: userFile[] = [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "sGjLxlDln2NUDSRwZmmdEYzeHB0b0drg",
      s3Key: "1731325920000-john-doe-Resume-2024.pdf",
      fileName: "john-doe-Resume-2024.pdf",
      fileSize: 245000,
      contentType: "application/pdf",
      uploadedAt: new Date("2025-11-10T14:32:00Z"),
    },
    {
      id: "223e4567-e89b-12d3-a456-426614174001",
      userId: "sGjLxlDln2NUDSRwZmmdEYzeHB0b0drg",
      s3Key: "1731239520000-john-doe-Cover-Letter.docx",
      fileName: "john-doe-Cover-Letter.docx",
      fileSize: 52000,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadedAt: new Date("2025-11-09T10:12:00Z"),
    },
    {
      id: "323e4567-e89b-12d3-a456-426614174002",
      userId: "sGjLxlDln2NUDSRwZmmdEYzeHB0b0drg",
      s3Key: "1731153120000-john-doe-Career-Summary.txt",
      fileName: "john-doe-Career-Summary.txt",
      fileSize: 8500,
      contentType: "text/plain",
      uploadedAt: new Date("2025-11-08T09:00:00Z"),
    },
  ];
  return (
    <div>
      <DataTable columns={columns} data={mockFiles} />
    </div>
  );
};

export default UserFilesTable;
