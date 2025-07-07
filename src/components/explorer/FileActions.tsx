"use client";

import React, { useCallback, useState } from "react";

import { useLayout } from "@/context/layoutContext";

import { cn } from "@/lib/utils";

import useLoading from "@/hooks/useLoading";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FileActions = React.memo(() => {
  const loading = useLoading();
  const { layout, setLayout, isPending } = useLayout();

  const [layoutOpen, setLayoutOpen] = useState<boolean>(false);

  const handleLayoutChange = useCallback(
    (newLayout: "grid" | "list") => {
      setLayout(newLayout);
      setLayoutOpen(false);
    },
    [setLayout]
  );

  if (loading) {
    return (
      <div className={cn("w-fit", "flex items-center justify-end gap-2")}>
        <Skeleton className="my-0.5 h-8 w-16 mobile:w-24" />
        <Skeleton className="my-0.5 h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      slot="actions"
      className={cn("w-fit", "flex items-center justify-end gap-2")}
    >
      <DropdownMenu open={layoutOpen} onOpenChange={setLayoutOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size={"icon"}
                variant={"outline"}
                className="flex items-center"
                disabled={isPending}
              >
                <Icon
                  name={layout === "grid" ? "LayoutGrid" : "LayoutList"}
                  size={"1rem"}
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Layout</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => handleLayoutChange("grid")}
            disabled={layout === "grid"}
          >
            <Icon name="LayoutGrid" className="mr-2" />
            <span>Grid</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleLayoutChange("list")}
            disabled={layout === "list"}
          >
            <Icon name="LayoutList" className="mr-2" />
            <span>List</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

FileActions.displayName = "FileActions";
export default FileActions;
