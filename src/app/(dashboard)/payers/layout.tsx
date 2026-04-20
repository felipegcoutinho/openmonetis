import { RiGroupLine } from "@remixicon/react";
import PageDescription from "@/shared/components/page-description";

export const metadata = {
	title: "Pessoas",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6">
			<PageDescription
				icon={<RiGroupLine />}
				title="Pessoas"
				subtitle="Gerencie as pessoas ou entidades responsáveis pelos pagamentos."
			/>
			{children}
		</section>
	);
}
