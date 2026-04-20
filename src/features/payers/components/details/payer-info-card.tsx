import { RiUser3Line } from "@remixicon/react";
import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { formatDateTime } from "@/shared/utils/date";
import { cn } from "@/shared/utils/ui";
import type { PayerInfo } from "./types";

type PayerInfoCardProps = {
	payer: PayerInfo;
};

export function PagadorInfoCard({ payer }: PayerInfoCardProps) {
	const showSensitiveDetails = payer.canEdit;

	const getStatusBadgeVariant = (status: string): "success" | "outline" => {
		const normalizedStatus = status.toLowerCase();
		if (normalizedStatus === "ativo") {
			return "success";
		}
		return "outline";
	};

	return (
		<Card className="border gap-4">
			<CardHeader className="gap-1.5">
				<CardTitle className="text-lg font-semibold">
					Detalhes da pessoa
				</CardTitle>
				<CardDescription>
					{showSensitiveDetails
						? "Informações cadastrais e preferências de envio."
						: "Informações cadastrais visíveis para este compartilhamento."}
				</CardDescription>
			</CardHeader>

			<CardContent className="grid gap-4 border-t border-dashed border-border/60 pt-6 text-sm sm:grid-cols-2">
				<InfoItem
					label="Status"
					value={
						<Badge
							variant={getStatusBadgeVariant(payer.status)}
							className="text-xs"
						>
							{payer.status}
						</Badge>
					}
				/>

				<InfoItem
					label="Papel"
					value={
						<span className="inline-flex items-center gap-2">
							<RiUser3Line className="size-4 text-muted-foreground" />
							{resolveRoleLabel(payer.role)}
						</span>
					}
				/>
				{showSensitiveDetails ? (
					<InfoItem
						label="Envio automático"
						value={payer.isAutoSend ? "Ativado" : "Desativado"}
					/>
				) : null}
				{showSensitiveDetails ? (
					<InfoItem
						label="Último envio"
						value={formatDateTime(payer.lastMailAt) ?? "Nunca enviado"}
					/>
				) : null}
				{showSensitiveDetails && !payer.email ? (
					<InfoItem
						label="Aviso"
						value={
							<span className="text-sm text-warning">
								Cadastre um e-mail para permitir o envio automático.
							</span>
						}
						className="sm:col-span-2"
					/>
				) : null}
				{showSensitiveDetails ? (
					<InfoItem
						label="Observações"
						value={
							payer.note ? (
								<span className="text-muted-foreground">{payer.note}</span>
							) : (
								"Sem observações"
							)
						}
						className="sm:col-span-2"
					/>
				) : null}
			</CardContent>
		</Card>
	);
}

const resolveRoleLabel = (role: string | null) => {
	if (role === PAYER_ROLE_ADMIN) return "Administrador";
	return "Pessoa";
};

type InfoItemProps = {
	label: string;
	value: ReactNode;
	className?: string;
};

function InfoItem({ label, value, className }: InfoItemProps) {
	return (
		<div className={cn("space-y-1", className)}>
			<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
				{label}
			</span>
			<div className="text-base text-foreground">{value}</div>
		</div>
	);
}
