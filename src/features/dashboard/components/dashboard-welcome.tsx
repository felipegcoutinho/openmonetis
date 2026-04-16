import { formatCurrentDate, getGreeting } from "./welcome-widget";

type DashboardWelcomeProps = {
	name?: string | null;
};

export function DashboardWelcome({ name }: DashboardWelcomeProps) {
	const displayName = name && name.trim().length > 0 ? name : "Administrador";
	const formattedDate = formatCurrentDate();
	const greeting = getGreeting();

	return (
		<section className="py-4">
			<div>
				<h1 className="text-xl tracking-tight">
					{greeting}, {displayName}
				</h1>
				<h2 className="mt-1 text-sm text-muted-foreground">{formattedDate}</h2>
			</div>
		</section>
	);
}
