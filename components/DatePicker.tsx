"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
  dateFormat?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Sélectionner une date",
  className,
  showIcon = true,
  dateFormat = "PPP",
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateChange = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
          {date ? (
            format(date, dateFormat, { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          locale={fr}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
