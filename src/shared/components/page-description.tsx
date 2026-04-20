export default function PageDescription({
	title,
	subtitle,
	icon,
}: {
	title?: string;
	subtitle?: string;
	icon?: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<h1 className="text-2xl font-semibold flex items-center gap-1">
				<span className="text-primary">{icon}</span>
				{title}
			</h1>
			<h2 className="text-sm max-w-2xl text-muted-foreground leading-relaxed">
				{subtitle}
			</h2>
		</div>
	);
}
