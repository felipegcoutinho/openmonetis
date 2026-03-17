import { RiPriceTag3Line } from "@remixicon/react";
import PageDescription from "@/shared/components/page-description";

export const metadata = {
	title: "Categorias",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiPriceTag3Line />}
				title="Categorias"
				subtitle="Gerencie suas categorias de despesas e receitas, permitindo ajustes financeiros precisos conforme necessário."
			/>
			{children}
		</section>
	);
}
