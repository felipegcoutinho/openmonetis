import Image from "next/image";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { CalculatorDialogButton } from "@/components/calculadora/calculator-dialog";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { NotificationBell } from "@/components/notificacoes/notification-bell";
import { PrivacyModeToggle } from "@/components/privacy-mode-toggle";
import { RefreshPageButton } from "@/components/refresh-page-button";
import type { DashboardNotificationsSnapshot } from "@/lib/dashboard/notifications";
import { TopNavMenu } from "./top-nav-menu";
import { TopbarUser } from "./topbar-user";

type AppTopbarProps = {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	pagadorAvatarUrl: string | null;
	preLancamentosCount?: number;
	notificationsSnapshot: DashboardNotificationsSnapshot;
};

export function AppTopbar({
	user,
	pagadorAvatarUrl,
	preLancamentosCount = 0,
	notificationsSnapshot,
}: AppTopbarProps) {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-primary flex h-14 shrink-0 items-center gap-3 px-4 shadow-md">
			{/* Logo */}
			<Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-1">
				<Image
					src="/logo_small.png"
					alt="OpenMonetis"
					width={28}
					height={28}
					className="object-contain"
					priority
				/>
				<Image
					src="/logo_text.png"
					alt="OpenMonetis"
					width={90}
					height={28}
					className="object-contain invert hidden sm:block"
					priority
				/>
			</Link>

			{/* Navigation */}
			<TopNavMenu preLancamentosCount={preLancamentosCount} />

			{/* Right-side actions — CSS vars overridden so icons render light on primary bg */}
			<div
				className="ml-auto flex items-center gap-1"
				style={
					{
						"--foreground": "var(--primary-foreground)",
						"--muted-foreground":
							"color-mix(in oklch, var(--primary-foreground) 70%, transparent)",
						"--accent":
							"color-mix(in oklch, var(--primary-foreground) 15%, transparent)",
						"--accent-foreground": "var(--primary-foreground)",
						"--border":
							"color-mix(in oklch, var(--primary-foreground) 30%, transparent)",
					} as React.CSSProperties
				}
			>
				<NotificationBell
					notifications={notificationsSnapshot.notifications}
					totalCount={notificationsSnapshot.totalCount}
				/>
				<CalculatorDialogButton withTooltip />
				<RefreshPageButton />
				<PrivacyModeToggle />
				<AnimatedThemeToggler />
				<span
					aria-hidden
					className="h-5 w-px bg-primary-foreground/30 mx-1 hidden sm:block"
				/>
				<FeedbackDialog />
			</div>

			{/* User avatar — outside the var-override div so dropdown stays normal */}
			<TopbarUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
		</header>
	);
}
