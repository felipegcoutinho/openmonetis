"use client";

import {
	RiDeleteBin5Line,
	RiFileList2Line,
	RiMailSendLine,
	RiPencilLine,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import type { Pagador } from "./types";

interface PagadorCardProps {
	pagador: Pagador;
	onEdit?: () => void;
	onRemove?: () => void;
}

export function PagadorCard({ pagador, onEdit, onRemove }: PagadorCardProps) {
	const avatarSrc = getAvatarSrc(pagador.avatarUrl);
	const isAdmin = pagador.role === PAGADOR_ROLE_ADMIN;
	const isReadOnly = !pagador.canEdit;

	return (
		<Card className=" overflow-hidden px-6">
			{/* Avatar posicionado sobre o header */}
			<div className="relative flex flex-col items-start">
				<div className="relative mb-3 flex size-16 items-center justify-center overflow-hidden rounded-full  border-background bg-background shadow-lg">
					<Image
						src={avatarSrc}
						alt={`Avatar de ${pagador.name}`}
						width={80}
						height={80}
						className="h-full w-full object-cover"
					/>
				</div>

				{/* Nome e badges */}
				<div className="flex items-center gap-1.5">
					<h3 className="text-base font-semibold text-foreground">
						{pagador.name}
					</h3>
					{isAdmin ? (
						<RiVerifiedBadgeFill className="size-4 text-blue-500" aria-hidden />
					) : null}
					{pagador.isAutoSend ? (
						<RiMailSendLine className="size-4 text-primary" aria-hidden />
					) : null}
				</div>

				{/* Email */}
				{pagador.email ? (
					<p className="mt-1 text-xs text-muted-foreground">{pagador.email}</p>
				) : (
					<p className="mt-1 text-xs text-muted-foreground">
						Sem email cadastrado
					</p>
				)}

				{/* Status badges */}
				<div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
					<Badge
						variant={pagador.status === "Ativo" ? "success" : "outline"}
						className="text-xs"
					>
						{pagador.status}
					</Badge>

					{isReadOnly ? (
						<Badge variant="outline" className="text-xs text-warning">
							Somente leitura
						</Badge>
					) : null}
				</div>
			</div>

			{/* Footer com links */}
			<div className="flex flex-wrap items-start justify-start gap-3 text-sm font-medium">
				{!isReadOnly && onEdit ? (
					<button
						type="button"
						onClick={onEdit}
						className={`text-primary flex items-center gap-1 font-medium transition-opacity hover:opacity-80`}
					>
						<RiPencilLine className="size-4" aria-hidden />
						editar
					</button>
				) : null}

				<Link
					href={`/payers/${pagador.id}`}
					className={`text-primary flex items-center gap-1 font-medium transition-opacity hover:opacity-80`}
				>
					<RiFileList2Line className="size-4" aria-hidden />
					detalhes
				</Link>

				{!isAdmin && !isReadOnly && onRemove ? (
					<button
						type="button"
						onClick={onRemove}
						className={`text-destructive flex items-center gap-1 font-medium transition-opacity hover:opacity-80`}
					>
						<RiDeleteBin5Line className="size-4" aria-hidden />
						remover
					</button>
				) : null}
			</div>
		</Card>
	);
}
