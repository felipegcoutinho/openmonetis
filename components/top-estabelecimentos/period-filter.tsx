"use client";

import { Button } from "@/components/ui/button";
import type { PeriodFilter } from "@/lib/top-estabelecimentos/fetch-data";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type PeriodFilterProps = {
  currentFilter: PeriodFilter;
};

const filterOptions: { value: PeriodFilter; label: string }[] = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];

export function PeriodFilterButtons({ currentFilter }: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (filter: PeriodFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("meses", filter);
    router.push(`/top-estabelecimentos?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
     
      <div className="flex items-center gap-1">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(option.value)}
            className={cn(
              "h-8",
              currentFilter === option.value && "pointer-events-none"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
