"use client";

import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import type { NoteSectionProps } from "./transaction-dialog-types";

export function NoteSection({ formState, onFieldChange }: NoteSectionProps) {
	return (
		<div className="space-y-1">
			<Label htmlFor="note">Anotação</Label>
			<Textarea
				id="note"
				value={formState.note}
				onChange={(event) => onFieldChange("note", event.target.value)}
				placeholder="Adicione observações sobre o lançamento"
				rows={2}
				className="min-h-[36px] resize-none"
			/>
		</div>
	);
}
