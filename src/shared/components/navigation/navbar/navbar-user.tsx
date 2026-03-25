"use client";

import {
	RiHistoryLine,
	RiLogoutCircleLine,
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Spinner } from "@/shared/components/ui/spinner";
import { authClient } from "@/shared/lib/auth/client";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
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
};

export function NavbarUser({ user, pagadorAvatarUrl }: NavbarUserProps) {
	const router = useRouter();
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);

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
				<DropdownMenuTrigger asChild>
					<button
						className="relative flex size-9 items-center justify-center overflow-hidden rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none"
						aria-label="Menu do usuário"
					>
						<Image
							src={avatarSrc}
							alt={`Avatar de ${user.name}`}
							width={40}
							height={40}
							className="size-10 rounded-full object-cover"
						/>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-60 border-border/60 p-2 shadow-none"
					sideOffset={10}
				>
					<DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
						<Image
							src={avatarSrc}
							alt={user.name}
							width={36}
							height={36}
							className="size-9 rounded-full object-cover shrink-0"
						/>
						<div className="flex flex-col min-w-0">
							<span className="text-sm font-medium truncate">{user.name}</span>
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
							<Badge variant="outline">v{version}</Badge>
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
