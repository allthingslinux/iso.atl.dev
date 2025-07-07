"use client";

import useRouter from "@/hooks/usePRouter";

import { Status } from "@/components/global";
import { Button } from "@/components/ui/button";

export default function NotFoundClient() {
  const router = useRouter();
  return (
    <div className="mx-auto flex h-full w-full max-w-(--breakpoint-md) grow flex-col items-center justify-center gap-12">
      <Status
        icon="Frown"
        message="Can't find the file or folder you're looking for"
      />

      <div className="flex w-full items-center gap-2">
        <Button
          className="grow"
          variant={"outline"}
          onClick={() => router.push("/")}
        >
          Home
        </Button>
        <Button className="grow" onClick={() => router.back()}>
          Previous Page
        </Button>
      </div>
    </div>
  );
}
