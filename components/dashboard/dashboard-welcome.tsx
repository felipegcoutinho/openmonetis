import { formatCurrentDate, getGreeting } from "./welcome-widget";

export function DashboardWelcome({ name }: { name?: string | null }) {
	const displayName = name && name.trim().length > 0 ? name : "Administrador";
	const formattedDate = formatCurrentDate();
	const greeting = getGreeting();

	return (
		<section className="p-2">
			<div className="tracking-tight">
				<h1 className="text-xl font-[aeonik]">
					{greeting}, {displayName}
				</h1>
				<p className="text-sm mt-1">{formattedDate}</p>
			</div>
		</section>
	);
}
