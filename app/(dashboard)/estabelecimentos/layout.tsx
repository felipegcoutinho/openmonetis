import { RiStore2Line } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Estabelecimentos | OpenMonetis",
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
				title="Estabelecimentos"
				subtitle="Gerencie os estabelecimentos dos seus lançamentos. Crie novos, exclua os que não têm lançamentos vinculados e abra o que está vinculado a cada um."
			/>
			{children}
		</section>
	);
}
