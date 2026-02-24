import { RiGroupLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Pagadores | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiGroupLine />}
				title="Pagadores"
				subtitle="Gerencie as pessoas ou entidades responsáveis pelos pagamentos."
			/>
			{children}
		</section>
	);
}
