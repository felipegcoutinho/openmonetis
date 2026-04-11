"use client";

import {
	RiCheckLine,
	RiFileCopyLine,
	RiHistoryLine,
	RiLogoutCircleLine,
	RiMegaphoneLine,
	RiMessageLine,
	RiSettings2Line,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { version } from "@/package.json";
import { FeedbackDialogBody } from "@/shared/components/navigation/navbar/feedback-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogTrigger } from "@/shared/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Spinner } from "@/shared/components/ui/spinner";
import { authClient } from "@/shared/lib/auth/client";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import type { UpdateCheckResult } from "@/shared/lib/version/check-update";
import { cn } from "@/shared/utils/ui";

const itemClass =
	"flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent";

type NavbarUserProps = {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	pagadorAvatarUrl: string | null;
	updateCheck: UpdateCheckResult;
};

export function NavbarUser({
	user,
	pagadorAvatarUrl,
	updateCheck,
}: NavbarUserProps) {
	const router = useRouter();
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	function handleCopyId() {
		navigator.clipboard.writeText(user.id);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const avatarSrc = pagadorAvatarUrl
		? getAvatarSrc(pagadorAvatarUrl)
		: user.image || getAvatarSrc(null);

	async function handleLogout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => router.push("/login"),
				onRequest: () => setLogoutLoading(true),
				onResponse: () => setLogoutLoading(false),
			},
		});
	}

	return (
		<Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
			<DropdownMenu>
				<div className="relative">
					<DropdownMenuTrigger asChild>
						<button
							className="flex size-9 items-center justify-center overflow-hidden rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none"
							aria-label="Menu do usuário"
						>
							<div className="relative size-10 overflow-hidden rounded-full">
								<Image
									src={avatarSrc}
									alt={`Avatar de ${user.name}`}
									fill
									sizes="40px"
									className="object-cover"
								/>
							</div>
						</button>
					</DropdownMenuTrigger>
					{updateCheck.hasUpdate && (
						<span className="pointer-events-none absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-success" />
					)}
				</div>
				<DropdownMenuContent
					align="end"
					className="w-60 border-border/60 p-2 shadow-none"
					sideOffset={10}
				>
					<DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
						<div className="relative size-9 shrink-0 overflow-hidden rounded-full">
							<Image
								src={avatarSrc}
								alt={user.name}
								fill
								sizes="36px"
								className="object-cover"
							/>
						</div>
						<div className="flex flex-col min-w-0">
							<div className="flex items-center gap-1 min-w-0">
								<span className="text-sm font-medium truncate">{user.name}</span>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={handleCopyId}
											className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
											aria-label="Copiar ID do usuário"
										>
											{copied ? (
												<RiCheckLine className="size-3 text-success" />
											) : (
												<RiFileCopyLine className="size-3" />
											)}
										</button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{copied ? "Copiado!" : "Copiar ID do usuário"}
									</TooltipContent>
								</Tooltip>
							</div>
							<span className="text-xs text-muted-foreground truncate">
								{user.email}
							</span>
						</div>
					</DropdownMenuLabel>

					<DropdownMenuSeparator />

					<div className="flex flex-col gap-0.5 py-1">
						<Link href="/settings" className={cn(itemClass, "text-foreground")}>
							<RiSettings2Line className="size-4 text-muted-foreground shrink-0" />
							Ajustes
						</Link>

						<Link
							href="/changelog"
							className={cn(itemClass, "text-foreground")}
						>
							<RiHistoryLine className="size-4 text-muted-foreground shrink-0" />
							<span className="flex-1">Changelog</span>
							<Badge variant="outline" className="text-xs font-semibold">
								v{version}
							</Badge>
						</Link>

						<DialogTrigger asChild>
							<button
								type="button"
								className={cn(itemClass, "text-foreground")}
							>
								<RiMessageLine className="size-4 text-muted-foreground shrink-0" />
								Enviar Feedback
							</button>
						</DialogTrigger>

						{updateCheck.hasUpdate && (
							<Link
								href={updateCheck.releaseUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(itemClass, "text-success")}
							>
								<RiMegaphoneLine className="size-4 text-success shrink-0" />
								<span className="flex-1 tracking-wide text-xs font-bold">
									Atualização {updateCheck.latestVersion} disponível
								</span>
							</Link>
						)}
					</div>

					<DropdownMenuSeparator />

					<div className="py-1">
						<button
							type="button"
							onClick={handleLogout}
							disabled={logoutLoading}
							aria-busy={logoutLoading}
							className={cn(
								itemClass,
								"text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-60",
							)}
						>
							{logoutLoading ? (
								<Spinner className="size-4 shrink-0" />
							) : (
								<RiLogoutCircleLine className="size-4 shrink-0" />
							)}
							{logoutLoading ? "Saindo..." : "Sair"}
						</button>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<FeedbackDialogBody onClose={() => setFeedbackOpen(false)} />
		</Dialog>
	);
}
