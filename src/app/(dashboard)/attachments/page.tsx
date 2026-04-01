import { connection } from "next/server";
import { AttachmentsPage } from "@/features/attachments/components/attachments-page";
import { fetchAttachmentsForPeriod } from "@/features/attachments/queries";
import { getUserId } from "@/shared/lib/auth/server";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

const getSingleParam = (
	params: Record<string, string | string[] | undefined> | undefined,
	key: string,
) => {
	const value = params?.[key];
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function Page({ searchParams }: PageProps) {
	await connection();
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period } = parsePeriodParam(periodoParam);

	const attachments = await fetchAttachmentsForPeriod(userId, period);

	return (
		<main className="flex flex-col gap-6">
			<AttachmentsPage attachments={attachments} />
		</main>
	);
}
