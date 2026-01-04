"use client";

import { Card } from "@/components/ui/card";
import { useMonthPeriod } from "@/hooks/use-month-period";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import LoadingSpinner from "./loading-spinner";
import NavigationButton from "./nav-button";
import ReturnButton from "./return-button";

export default function MonthNavigation() {
  const {
    monthNames,
    currentMonth,
    currentYear,
    defaultMonth,
    defaultYear,
    buildHref,
  } = useMonthPeriod();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentMonthLabel = useMemo(
    () => currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1),
    [currentMonth]
  );

  const currentMonthIndex = useMemo(
    () => monthNames.indexOf(currentMonth),
    [monthNames, currentMonth]
  );

  const prevTarget = useMemo(() => {
    let idx = currentMonthIndex - 1;
    let year = currentYear;
    if (idx < 0) {
      idx = monthNames.length - 1;
      year = (parseInt(currentYear) - 1).toString();
    }
    return buildHref(monthNames[idx], year);
  }, [currentMonthIndex, currentYear, monthNames, buildHref]);

  const nextTarget = useMemo(() => {
    let idx = currentMonthIndex + 1;
    let year = currentYear;
    if (idx >= monthNames.length) {
      idx = 0;
      year = (parseInt(currentYear) + 1).toString();
    }
    return buildHref(monthNames[idx], year);
  }, [currentMonthIndex, currentYear, monthNames, buildHref]);

  const returnTarget = useMemo(
    () => buildHref(defaultMonth, defaultYear),
    [buildHref, defaultMonth, defaultYear]
  );

  const isDifferentFromCurrent =
    currentMonth !== defaultMonth || currentYear !== defaultYear.toString();

  // Prefetch otimizado: apenas meses adjacentes (M-1, M+1) e mês atual
  // Isso melhora a performance da navegação sem sobrecarregar o cliente
  useEffect(() => {
    // Prefetch do mês anterior e próximo para navegação instantânea
    router.prefetch(prevTarget);
    router.prefetch(nextTarget);

    // Prefetch do mês atual se não estivermos nele
    if (isDifferentFromCurrent) {
      router.prefetch(returnTarget);
    }
  }, [router, prevTarget, nextTarget, returnTarget, isDifferentFromCurrent]);

  const handleNavigate = (href: string) => {
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <Card className="sticky top-0 z-30 w-full flex-row bg-month-picker text-month-picker-foreground p-5">
      <div className="flex items-center gap-1">
        <NavigationButton
          direction="left"
          disabled={isPending}
          onClick={() => handleNavigate(prevTarget)}
        />

        <div className="flex items-center">
          <div
            className="mx-1 space-x-1 capitalize font-bold"
            aria-current={!isDifferentFromCurrent ? "date" : undefined}
            aria-label={`Período selecionado: ${currentMonthLabel} de ${currentYear}`}
          >
            <span>{currentMonthLabel}</span>
            <span>{currentYear}</span>
          </div>

          {isPending && <LoadingSpinner />}
        </div>

        <NavigationButton
          direction="right"
          disabled={isPending}
          onClick={() => handleNavigate(nextTarget)}
        />
      </div>

      {isDifferentFromCurrent && (
        <ReturnButton
          disabled={isPending}
          onClick={() => handleNavigate(returnTarget)}
        />
      )}
    </Card>
  );
}
