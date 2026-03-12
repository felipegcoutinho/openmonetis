import { cn } from "@/shared/utils";

type StatusDotProps = {
	color: string;
	className?: string;
};

export default function StatusDot({ color, className }: StatusDotProps) {
	return (
		<span
			className={cn(
				"inline-block size-2 shrink-0 rounded-full",
				color,
				className,
			)}
			aria-hidden="true"
		/>
	);
}
