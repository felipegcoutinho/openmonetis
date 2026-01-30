import { RiFileChartLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Tendências | Opensheets",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiFileChartLine />}
				title="Tendências"
				subtitle="Acompanhe a evolução dos seus gastos e receitas por categoria ao longo do tempo."
			/>
			{children}
		</section>
	);
}
