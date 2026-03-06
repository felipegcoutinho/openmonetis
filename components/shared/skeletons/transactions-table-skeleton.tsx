import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

/**
 * Skeleton fiel à tabela de lançamentos
 * Mantém a mesma estrutura de colunas
 */
export function TransactionsTableSkeleton() {
	return (
		<div className="rounded-2xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[180px]">Nome</TableHead>
						<TableHead className="w-[100px]">Data</TableHead>
						<TableHead className="w-[120px]">Tipo</TableHead>
						<TableHead className="w-[120px]">Valor</TableHead>
						<TableHead className="w-[120px]">Condição</TableHead>
						<TableHead className="w-[120px]">Pagamento</TableHead>
						<TableHead className="w-[140px]">Pagador</TableHead>
						<TableHead className="w-[140px]">Categoria</TableHead>
						<TableHead className="w-[140px]">Conta/Cartão</TableHead>
						<TableHead className="w-[80px]">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 8 }).map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className="h-4 w-full rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-16 rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20 rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-16 rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-20 rounded-2xl bg-foreground/10" />
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Skeleton className="size-6 rounded-full bg-foreground/10" />
									<Skeleton className="h-4 w-16 rounded-2xl bg-foreground/10" />
								</div>
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Skeleton className="size-4 rounded-2xl bg-foreground/10" />
									<Skeleton className="h-4 w-16 rounded-2xl bg-foreground/10" />
								</div>
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Skeleton className="size-6 rounded-2xl bg-foreground/10" />
									<Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
								</div>
							</TableCell>
							<TableCell>
								<div className="flex gap-1">
									<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
									<Skeleton className="size-8 rounded-2xl bg-foreground/10" />
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
