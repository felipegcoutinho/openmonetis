"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Card } from "@/shared/components/ui/card";
import { getNextPeriod, getPreviousPeriod } from "@/shared/utils/period";
import LoadingSpinner from "./loading-spinner";
import NavigationButton from "./nav-button";
import ReturnButton from "./return-button";
import { useMonthPeriod } from "./use-month-period";

export default function MonthNavigation() {
	const { period, currentMonth, currentYear, defaultPeriod, buildHref } =
		useMonthPeriod();

	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const currentMonthLabel = `${currentMonth.charAt(0).toUpperCase()}${currentMonth.slice(1)} ${currentYear}`;
	const prevTarget = buildHref(getPreviousPeriod(period));
	const nextTarget = buildHref(getNextPeriod(period));
	const returnTarget = buildHref(defaultPeriod);
	const isDifferentFromCurrent = period !== defaultPeriod;

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
		<Card className="flex w-full flex-row p-4 sticky top-16 z-10 backdrop-blur-sm bg-card/30">
			<div className="flex items-center gap-1">
				<NavigationButton
					direction="left"
					disabled={isPending}
					onClick={() => handleNavigate(prevTarget)}
				/>

				<div className="flex items-center">
					<div
						className="mx-1 space-x-1 capitalize font-semibold"
						aria-current={!isDifferentFromCurrent ? "date" : undefined}
						aria-label={`Período selecionado: ${currentMonthLabel}`}
					>
						<span>{currentMonthLabel}</span>
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
