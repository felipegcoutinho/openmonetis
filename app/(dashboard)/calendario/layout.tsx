import { RiCalendarEventLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Calendário | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 px-6">
			<PageDescription
				icon={<RiCalendarEventLine />}
				title="Calendário"
				subtitle="Visualize lançamentos, vencimentos de cartões e boletos em um só lugar. Clique em uma data para detalhar ou criar um novo lançamento."
			/>
			{children}
		</section>
	);
}
