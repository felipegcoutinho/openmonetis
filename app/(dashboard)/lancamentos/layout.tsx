import { RiArrowLeftRightLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Lançamentos | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiArrowLeftRightLine />}
				title="Lançamentos"
				subtitle="Acompanhe todos os lançamentos financeiros do mês selecionado incluindo
        receitas, despesas e transações previstas. Use o seletor abaixo para
        navegar pelos meses e visualizar as movimentações correspondentes."
			/>
			{children}
		</section>
	);
}
