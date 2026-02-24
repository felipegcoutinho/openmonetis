"use client";

import {
	RiChat3Line,
	RiDeleteBin5Line,
	RiEyeLine,
	RiPencilLine,
} from "@remixicon/react";
import Image from "next/image";
import { useMemo } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/ui";
import MoneyValues from "../money-values";

interface CardItemProps {
	name: string;
	brand: string;
	status: string;
	closingDay: string;
	dueDay: string;
	limit: number | null;
	limitInUse?: number | null;
	limitAvailable?: number | null;
	contaName: string;
	logo?: string | null;
	note?: string | null;
	onEdit?: () => void;
	onInvoice?: () => void;
	onRemove?: () => void;
}

const BRAND_ASSETS: Record<string, string> = {
	visa: "/bandeiras/visa.svg",
	mastercard: "/bandeiras/mastercard.svg",
	amex: "/bandeiras/amex.svg",
	american: "/bandeiras/amex.svg",
	elo: "/bandeiras/elo.svg",
	hipercard: "/bandeiras/hipercard.svg",
	hiper: "/bandeiras/hipercard.svg",
};

const resolveBrandAsset = (brand: string) => {
	const normalized = brand.trim().toLowerCase();

	const match = (
		Object.keys(BRAND_ASSETS) as Array<keyof typeof BRAND_ASSETS>
	).find((entry) => normalized.includes(entry));

	return match ? BRAND_ASSETS[match] : null;
};

const formatDay = (value: string) => value.padStart(2, "0");

export function CardItem({
	name,
	brand,
	status,
	closingDay,
	dueDay,
	limit,
	limitInUse,
	limitAvailable,
	contaName: _contaName,
	logo,
	note,
	onEdit,
	onInvoice,
	onRemove,
}: CardItemProps) {
	void _contaName;

	const limitTotal = limit ?? null;
	const used =
		limitInUse ??
		(limitTotal !== null && limitAvailable !== null
			? Math.max(limitTotal - limitAvailable, 0)
			: limitTotal !== null
				? 0
				: null);

	const available =
		limitAvailable ??
		(limitTotal !== null && used !== null
			? Math.max(limitTotal - used, 0)
			: null);

	const usagePercent =
		limitTotal && limitTotal > 0 && used !== null
			? Math.min(Math.max((used / limitTotal) * 100, 0), 100)
			: 0;

	const logoPath = useMemo(() => {
		if (!logo) {
			return null;
		}

		if (
			logo.startsWith("http://") ||
			logo.startsWith("https://") ||
			logo.startsWith("data:")
		) {
			return logo;
		}

		return logo.startsWith("/") ? logo : `/logos/${logo}`;
	}, [logo]);

	const brandAsset = useMemo(() => resolveBrandAsset(brand), [brand]);

	const isInactive = useMemo(
		() => status?.toLowerCase() === "inativo",
		[status],
	);

	const metrics = useMemo(() => {
		if (limitTotal === null) return null;

		return [
			{ label: "Limite Total", value: limitTotal },
			{ label: "Em uso", value: used },
			{ label: "Disponível", value: available },
		];
	}, [available, limitTotal, used]);

	const actions = useMemo(
		() => [
			{
				label: "editar",
				icon: <RiPencilLine className="size-4" aria-hidden />,
				onClick: onEdit,
				className: "text-primary",
			},
			{
				label: "ver fatura",
				icon: <RiEyeLine className="size-4" aria-hidden />,
				onClick: onInvoice,
				className: "text-primary",
			},
			{
				label: "remover",
				icon: <RiDeleteBin5Line className="size-4" aria-hidden />,
				onClick: onRemove,
				className: "text-destructive",
			},
		],
		[onEdit, onInvoice, onRemove],
	);

	return (
		<Card className="flex flex-col p-6 w-full">
			<CardHeader className="space-y-2 px-0 pb-0">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-1 items-center gap-2">
						{logoPath ? (
							<div className="flex size-10 shrink-0 items-center justify-center overflow-hidden">
								<Image
									src={logoPath}
									alt={`Logo do cartão ${name}`}
									width={42}
									height={42}
									className={cn(
										"rounded-full",
										isInactive && "grayscale opacity-40",
									)}
								/>
							</div>
						) : null}

						<div className="min-w-0">
							<div className="flex items-center gap-1.5">
								<h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
									{name}
								</h3>
								{note ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="text-muted-foreground/70 transition-colors hover:text-foreground"
												aria-label="Observações do cartão"
											>
												<RiChat3Line className="size-3.5" />
											</button>
										</TooltipTrigger>
										<TooltipContent side="top" align="start">
											{note}
										</TooltipContent>
									</Tooltip>
								) : null}
							</div>

							{status ? (
								<span className="text-xs tracking-wide text-muted-foreground">
									{status}
								</span>
							) : null}
						</div>
					</div>

					{brandAsset ? (
						<div className="flex items-center justify-center py-1">
							<Image
								src={brandAsset}
								alt={`Bandeira ${brand}`}
								width={36}
								height={36}
								className={cn(
									"h-5 w-auto rounded",
									isInactive && "grayscale opacity-40",
								)}
							/>
						</div>
					) : (
						<span className="text-sm font-medium text-muted-foreground">
							{brand}
						</span>
					)}
				</div>

				<div className="flex items-center justify-between border-y border-dashed py-3 text-xs font-medium text-muted-foreground sm:text-sm">
					<span>
						Fecha dia{" "}
						<span className="font-semibold text-foreground">
							{formatDay(closingDay)}
						</span>
					</span>
					<span>
						Vence dia{" "}
						<span className="font-semibold text-foreground">
							{formatDay(dueDay)}
						</span>
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-5 px-0">
				{metrics ? (
					<>
						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col items-start gap-1">
								<p className="text-sm font-semibold text-foreground">
									<MoneyValues amount={metrics[0].value} />
								</p>
								<span className="text-xs font-medium text-muted-foreground">
									{metrics[0].label}
								</span>
							</div>

							<div className="flex flex-col items-center gap-1">
								<p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
									<span className="size-2 rounded-full bg-primary" />
									<MoneyValues amount={metrics[1].value} />
								</p>
								<span className="text-xs font-medium text-muted-foreground">
									{metrics[1].label}
								</span>
							</div>

							<div className="flex flex-col items-end gap-1">
								<p className="text-sm font-semibold text-foreground">
									<MoneyValues amount={metrics[2].value} />
								</p>
								<span className="text-xs font-medium text-muted-foreground">
									{metrics[2].label}
								</span>
							</div>
						</div>

						<Progress value={usagePercent} className="h-3" />
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						Ainda não há limite registrado para este cartão.
					</p>
				)}
			</CardContent>

			<CardFooter className="mt-auto flex flex-wrap gap-4 px-0 text-sm">
				{actions.map(({ label, icon, onClick, className }) => (
					<button
						key={label}
						type="button"
						onClick={onClick}
						className={cn(
							"flex items-center gap-1 font-medium transition-opacity hover:opacity-80",
							className,
						)}
					>
						{icon}
						{label}
					</button>
				))}
			</CardFooter>
		</Card>
	);
}
