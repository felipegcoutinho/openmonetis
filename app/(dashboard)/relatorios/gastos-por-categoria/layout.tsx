import { RiPieChartLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Gastos por categoria | OpenMonetis",
};

export default function GastosPorCategoriaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiPieChartLine />}
				title="Gastos por categoria"
				subtitle="Visualize suas despesas divididas por categoria no mês selecionado. Altere o mês para comparar períodos."
			/>
			{children}
		</section>
	);
}
