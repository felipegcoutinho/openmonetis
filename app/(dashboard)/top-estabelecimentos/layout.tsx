import { RiStore2Line } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Top Estabelecimentos | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiStore2Line />}
				title="Top Estabelecimentos"
				subtitle="Análise dos locais onde você mais compra e gasta"
			/>
			{children}
		</section>
	);
}
