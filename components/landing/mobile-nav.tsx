"use client";

import { RiArrowRightSLine, RiMenuLine } from "@remixicon/react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
	{ href: "#telas", label: "Conheça as telas" },
	{ href: "#funcionalidades", label: "Funcionalidades" },
	{ href: "#companion", label: "Companion" },
	{ href: "#stack", label: "Stack" },
	{ href: "#como-usar", label: "Como usar" },
];

interface MobileNavProps {
	isPublicDomain: boolean;
	isLoggedIn: boolean;
}

export function MobileNav({ isPublicDomain, isLoggedIn }: MobileNavProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="md:hidden">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setOpen(true)}
				aria-label="Abrir menu"
			>
				<RiMenuLine size={20} />
			</Button>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="right" className="w-72">
					<SheetHeader className="border-b pb-4">
						<SheetTitle asChild>
							<Logo variant="compact" />
						</SheetTitle>
					</SheetHeader>

					<nav className="flex flex-col gap-1 px-4">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								onClick={() => setOpen(false)}
								className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								{link.label}
							</a>
						))}
					</nav>

					{!isPublicDomain && (
						<div className="mt-auto flex flex-col gap-2 border-t p-4">
							{isLoggedIn ? (
								<Link href="/dashboard" onClick={() => setOpen(false)}>
									<Button variant="outline" className="w-full">
										Dashboard
									</Button>
								</Link>
							) : (
								<>
									<Link href="/login" onClick={() => setOpen(false)}>
										<Button variant="ghost" className="w-full">
											Entrar
										</Button>
									</Link>
									<Link href="/signup" onClick={() => setOpen(false)}>
										<Button className="w-full gap-2">
											Começar
											<RiArrowRightSLine size={16} />
										</Button>
									</Link>
								</>
							)}
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
