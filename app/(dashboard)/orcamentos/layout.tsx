import { RiFundsLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Orçamentos | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiFundsLine />}
				title="Orçamentos"
				subtitle="Gerencie seus orçamentos mensais por categorias. Acompanhe o progresso do seu orçamento e faça ajustes conforme necessário."
			/>
			{children}
		</section>
	);
}
