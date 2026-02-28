"use client";

import { Button } from "../ui/button";

interface ReturnButtonProps {
	disabled?: boolean;
	onClick: () => void;
}

export default function ReturnButton({ disabled, onClick }: ReturnButtonProps) {
	return (
		<Button
			className="w-max h-6 lowercase"
			size="sm"
			disabled={disabled}
			onClick={onClick}
			aria-label="Retornar para o mês atual"
		>
			Mês Atual
		</Button>
	);
}
