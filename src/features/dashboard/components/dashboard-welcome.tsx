import {
	formatCurrentDate,
	getGreeting,
} from "@/features/dashboard/widget-registry/welcome-widget";

type DashboardWelcomeProps = {
	name?: string | null;
};

export function DashboardWelcome({ name }: DashboardWelcomeProps) {
	const displayName = name && name.trim().length > 0 ? name : "Administrador";
	const formattedDate = formatCurrentDate();
	const greeting = getGreeting();

	return (
		<section className="py-4 space-y-1">
			<h1 className="text-xl tracking-tight">
				<span className="text-muted-foreground">{greeting},</span> {displayName}
			</h1>
			<h2 className="text-sm text-muted-foreground">{formattedDate}</h2>
		</section>
	);
}
