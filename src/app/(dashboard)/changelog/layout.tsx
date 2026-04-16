import { RiHistoryLine } from "@remixicon/react";
import PageDescription from "@/shared/components/page-description";

export const metadata = {
	title: "Changelog",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6">
			<PageDescription
				icon={<RiHistoryLine />}
				title="Changelog"
				subtitle="Acompanhe todas as alterações feitas na plataforma."
			/>
			{children}
		</section>
	);
}
