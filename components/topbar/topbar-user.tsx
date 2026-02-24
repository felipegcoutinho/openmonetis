"use client";

import {
	RiLogoutCircleLine,
	RiMessageLine,
	RiSettings2Line,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FeedbackDialogBody } from "@/components/feedback/feedback-dialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/client";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { cn } from "@/lib/utils/ui";
import { version } from "@/package.json";

const itemClass =
	"flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent";

type TopbarUserProps = {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	pagadorAvatarUrl: string | null;
};

export function TopbarUser({ user, pagadorAvatarUrl }: TopbarUserProps) {
	const router = useRouter();
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [feedbackOpen, setFeedbackOpen] = useState(false);

	const avatarSrc = useMemo(() => {
		if (pagadorAvatarUrl) return getAvatarSrc(pagadorAvatarUrl);
		if (user.image) return user.image;
		return getAvatarSrc(null);
	}, [user.image, pagadorAvatarUrl]);

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
						className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border-background bg-background shadow-lg"
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
				<DropdownMenuContent align="end" className="w-60 p-2" sideOffset={10}>
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
						<Link href="/ajustes" className={cn(itemClass, "text-foreground")}>
							<RiSettings2Line className="size-4 text-muted-foreground shrink-0" />
							Ajustes
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
					<DropdownMenuSeparator />
					<div className="px-3 py-1.5">
						<span className="text-[10px] font-mono text-muted-foreground/40 select-none">
							Versão {version}
						</span>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<FeedbackDialogBody onClose={() => setFeedbackOpen(false)} />
		</Dialog>
	);
}
