"use client";

import { RiSettings2Line } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import LogoutButton from "@/components/auth/logout-button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarSrc } from "@/lib/pagadores/utils";

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
	const avatarSrc = useMemo(() => {
		if (pagadorAvatarUrl) return getAvatarSrc(pagadorAvatarUrl);
		if (user.image) return user.image;
		return getAvatarSrc(null);
	}, [user.image, pagadorAvatarUrl]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center rounded-full ring-2 ring-primary-foreground/40 hover:ring-primary-foreground/80 transition-all focus-visible:outline-none focus-visible:ring-primary-foreground"
				>
					<Image
						src={avatarSrc}
						alt={user.name}
						width={32}
						height={32}
						className="size-8 rounded-full object-cover"
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
				<div className="flex flex-col gap-1 pt-1">
					<Link
						href="/ajustes"
						className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
					>
						<RiSettings2Line className="size-4 text-muted-foreground" />
						Ajustes
					</Link>
					<div className="px-1 py-0.5">
						<LogoutButton />
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
