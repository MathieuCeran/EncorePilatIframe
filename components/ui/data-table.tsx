"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  value: string;
}

export interface Action<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  actions?: Action<T>[];
  loading?: boolean;
  pageSize?: number; // Nombre d'éléments par page (par défaut 10)
}

export function DataTable<T>({
  data,
  columns,
  title,
  description,
  searchPlaceholder = "Rechercher...",
  searchFields = [],
  filterOptions = [],
  filterValue = "all",
  onFilterChange,
  actions = [],
  loading = false,
  pageSize = 5,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrer les données
  const filteredData = data.filter((item) => {
    // Filtre de recherche
    const matchesSearch =
      searchFields.length === 0 ||
      searchTerm === "" ||
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

    // Filtre par type (si applicable)
    const matchesFilter =
      filterValue === "all" ||
      filterOptions.length === 0 ||
      (() => {
        // Chercher la colonne qui correspond au filtre
        const filterColumn = columns.find(
          (col) => col.key === "type_pack" || col.key === "type"
        );
        if (!filterColumn) return true;

        const itemValue = item[filterColumn.key as keyof T];
        return itemValue === filterValue;
      })();

    return matchesSearch && matchesFilter;
  });

  // Pagination (client-side)
  const totalItems = filteredData.length;
  const effectivePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedCurrentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Reset page when the search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} ({filteredData.length})
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Filtres et recherche */}
        {(searchFields.length > 0 || filterOptions.length > 0) && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {searchFields.length > 0 && (
                    <div className="flex-1">
                      <Label htmlFor="search">Rechercher</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder={searchPlaceholder}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  {filterOptions.length > 0 && (
                    <div className="w-48">
                      <Label htmlFor="filter">Filtrer</Label>
                      <Select
                        value={filterValue}
                        onValueChange={onFilterChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table */}
        <div className="h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={
                                action.variant === "destructive"
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalItems === 0
              ? "Aucun élément"
              : `Affichage ${startIndex + 1}–${endIndex} sur ${totalItems}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={clampedCurrentPage === 1 || totalItems === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="text-sm">
              Page {clampedCurrentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={clampedCurrentPage === totalPages || totalItems === 0}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
