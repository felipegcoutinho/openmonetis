"use client";

import MagnetLines from "../magnet-lines";
import { Card } from "../ui/card";

type DashboardWelcomeProps = {
	name?: string | null;
	disableMagnetlines?: boolean;
};

const capitalizeFirstLetter = (value: string) =>
	value.length > 0 ? value[0]?.toUpperCase() + value.slice(1) : value;

const formatCurrentDate = (date = new Date()) => {
	const formatted = new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "America/Sao_Paulo",
	}).format(date);

	return capitalizeFirstLetter(formatted);
};

const getGreeting = () => {
	const now = new Date();

	// Get hour in Brasilia timezone
	const brasiliaHour = new Intl.DateTimeFormat("pt-BR", {
		hour: "numeric",
		hour12: false,
		timeZone: "America/Sao_Paulo",
	}).format(now);

	const hour = parseInt(brasiliaHour, 10);

	if (hour >= 5 && hour < 12) {
		return "Bom dia";
	} else if (hour >= 12 && hour < 18) {
		return "Boa tarde";
	} else {
		return "Boa noite";
	}
};

export function DashboardWelcome({
	name,
	disableMagnetlines = false,
}: DashboardWelcomeProps) {
	const displayName = name && name.trim().length > 0 ? name : "Administrador";
	const formattedDate = formatCurrentDate();
	const greeting = getGreeting();

	return (
		<Card className="relative px-6 py-12 bg-welcome-banner overflow-hidden">
			<div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
				<MagnetLines
					rows={8}
					columns={16}
					containerSize="100%"
					lineColor="currentColor"
					lineWidth="0.4vmin"
					lineHeight="5vmin"
					baseAngle={0}
					className="text-welcome-banner-foreground"
					disabled={disableMagnetlines}
				/>
			</div>
			<div className="relative tracking-tight text-welcome-banner-foreground">
				<h1 className="text-xl font-medium">
					{greeting}, {displayName}! <span aria-hidden="true">👋</span>
				</h1>
				<p className="mt-2 text-sm opacity-90">{formattedDate}</p>
			</div>
		</Card>
	);
}
