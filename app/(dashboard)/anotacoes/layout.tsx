import { RiTodoLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Anotações | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiTodoLine />}
				title="Notas"
				subtitle="Gerencie suas anotações e mantenha o controle sobre suas ideias e tarefas."
			/>
			{children}
		</section>
	);
}
