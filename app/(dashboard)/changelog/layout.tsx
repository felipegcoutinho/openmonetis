import { RiHistoryLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Cartões | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiHistoryLine />}
				title="Changelog"
				subtitle="Acompanhe todas as alterações feitas na plataforma."
			/>
			{children}
		</section>
	);
}
