import { RiBankLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Contas | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiBankLine />}
				title="Contas"
				subtitle="Acompanhe todas as contas do mês selecionado incluindo receitas,
        despesas e transações previstas. Use o seletor abaixo para navegar pelos
        meses e visualizar as movimentações correspondentes."
			/>
			{children}
		</section>
	);
}
