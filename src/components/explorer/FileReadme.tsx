"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Markdown } from "@/components/global";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  content: string;
  title: string;
};
export default function FileReadme({ content, title }: Props) {
  const [view] = useState<"markdown" | "raw">("markdown");

  return (
    <div slot="readme" className="w-full">
      <Card>
        <CardHeader className="pb-0">
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              "mobile:flex-row mobile:items-center mobile:justify-between"
            )}
          >
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-1.5 px-3 pt-0 tablet:p-3 tablet:px-6 tablet:pt-0">
          <Markdown content={content} view={view} />
        </CardContent>
      </Card>
    </div>
  );
}
