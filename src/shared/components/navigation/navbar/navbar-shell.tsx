import Link from "next/link";
import { Logo } from "@/shared/components/logo";

type NavbarShellProps = {
	logoHref?: string;
	fixed?: boolean;
	children: React.ReactNode;
};

export function NavbarShell({
	logoHref,
	fixed = false,
	children,
}: NavbarShellProps) {
	const positionClass = fixed ? "fixed top-0 left-0 right-0" : "sticky top-0";

	return (
		<header
			className={`${positionClass} z-50 flex h-16 shrink-0 items-center bg-primary`}
		>
			<div className="relative z-10 mx-auto flex h-full w-full max-w-8xl items-center gap-4 px-4">
				{logoHref ? (
					<Link href={logoHref} className="shrink-0">
						<Logo variant="compact" invertTextOnDark={false} />
					</Link>
				) : (
					<Logo variant="compact" invertTextOnDark={false} />
				)}
				{children}
			</div>
		</header>
	);
}
