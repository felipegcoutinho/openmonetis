import { RiBankCard2Line } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Uso de Cartões | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiBankCard2Line />}
				title="Uso de Cartões"
				subtitle="Análise detalhada do uso dos seus cartões de crédito."
			/>
			{children}
		</section>
	);
}
