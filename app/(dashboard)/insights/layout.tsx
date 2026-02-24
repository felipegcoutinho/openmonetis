import { RiSparklingLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Insights | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiSparklingLine />}
				title="Insights"
				subtitle="Análise inteligente dos seus dados financeiros para identificar padrões, comportamentos e oportunidades de melhoria."
			/>
			{children}
		</section>
	);
}
