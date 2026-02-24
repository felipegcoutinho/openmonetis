import { RiSettings2Line } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Ajustes | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiSettings2Line />}
				title="Ajustes"
				subtitle="Gerencie informações da conta, segurança e outras opções para otimizar sua experiência."
			/>
			{children}
		</section>
	);
}
