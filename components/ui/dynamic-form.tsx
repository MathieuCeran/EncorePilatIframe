"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "dynamic-list";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: FormFieldValue) => string | null;
}

export interface DynamicFormProps {
  fields: FormField[];
  data: Record<string, FormFieldValue>;
  onChange: (key: string, value: FormFieldValue) => void;
  onAddItem?: (key: string) => void;
  onRemoveItem?: (key: string, index: number) => void;
  onUpdateItem?: (key: string, index: number, value: string) => void;
}

type FormFieldValue = string | number | boolean | string[];

export function DynamicForm({
  fields,
  data,
  onChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: DynamicFormProps) {
  const renderField = (field: FormField) => {
    const value = data[field.key];

    switch (field.type) {
      case "text":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              value={typeof value === "number" ? value : 0}
              onChange={(e) =>
                onChange(field.key, parseFloat(e.target.value) || 0)
              }
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Textarea
              id={field.key}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(val) => onChange(field.key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "checkbox":
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.key}
              checked={value === true}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        );

      case "dynamic-list":
        const listValue = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div key={field.key}>
            <div className="flex justify-between items-center mb-2">
              <Label>{field.label}</Label>
              {onAddItem && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddItem(field.key)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
            {listValue.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={item}
                  onChange={(e) =>
                    onUpdateItem?.(field.key, index, e.target.value)
                  }
                  placeholder={field.placeholder}
                  className="flex-1"
                />
                {onRemoveItem && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveItem(field.key, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="grid gap-4">{fields.map(renderField)}</div>;
}
