import { eq } from "drizzle-orm";
import { categorias } from "@/db/schema";
import type { CategoryType } from "@/lib/categorias/constants";
import { db } from "@/lib/db";

type DefaultCategory = {
	name: string;
	type: CategoryType;
	icon: string | null;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
	// Despesas
	{ name: "Alimentação", type: "despesa", icon: "RiRestaurant2Line" },
	{ name: "Transporte", type: "despesa", icon: "RiBusLine" },
	{ name: "Moradia", type: "despesa", icon: "RiHomeLine" },
	{ name: "Saúde", type: "despesa", icon: "RiStethoscopeLine" },
	{ name: "Educação", type: "despesa", icon: "RiBook2Line" },
	{ name: "Lazer", type: "despesa", icon: "RiGamepadLine" },
	{ name: "Compras", type: "despesa", icon: "RiShoppingBagLine" },
	{ name: "Assinaturas", type: "despesa", icon: "RiServiceLine" },
	{ name: "Pets", type: "despesa", icon: "RiBearSmileLine" },
	{ name: "Mercado", type: "despesa", icon: "RiShoppingBasketLine" },
	{ name: "Restaurantes", type: "despesa", icon: "RiRestaurantLine" },
	{ name: "Delivery", type: "despesa", icon: "RiMotorbikeLine" },
	{ name: "Energia e água", type: "despesa", icon: "RiFlashlightLine" },
	{ name: "Internet", type: "despesa", icon: "RiWifiLine" },
	{ name: "Vestuário", type: "despesa", icon: "RiTShirtLine" },
	{ name: "Viagem", type: "despesa", icon: "RiFlightTakeoffLine" },
	{ name: "Presentes", type: "despesa", icon: "RiGiftLine" },
	{ name: "Pagamentos", type: "despesa", icon: "RiBillLine" },
	{ name: "Outras despesas", type: "despesa", icon: "RiMore2Line" },

	// Receitas
	{ name: "Salário", type: "receita", icon: "RiWallet3Line" },
	{ name: "Freelance", type: "receita", icon: "RiUserStarLine" },
	{ name: "Investimentos", type: "receita", icon: "RiStockLine" },
	{ name: "Vendas", type: "receita", icon: "RiShoppingCartLine" },
	{ name: "Prêmios", type: "receita", icon: "RiMedalLine" },
	{ name: "Reembolso", type: "receita", icon: "RiRefundLine" },
	{ name: "Aluguel recebido", type: "receita", icon: "RiBuilding2Line" },
	{ name: "Outras receitas", type: "receita", icon: "RiMore2Line" },
	{ name: "Saldo inicial", type: "receita", icon: "RiWallet2Line" },

	// Categoria especial para transferências entre contas
	{
		name: "Transferência interna",
		type: "receita",
		icon: "RiArrowLeftRightLine",
	},
];

/**
 * Seeds default categories for a new user
 * @param userId - User ID to seed categories for
 */
export async function seedDefaultCategoriesForUser(userId: string | undefined) {
	if (!userId) {
		return;
	}

	const existing = await db.query.categorias.findFirst({
		columns: { id: true },
		where: eq(categorias.userId, userId),
	});

	if (existing) {
		return;
	}

	if (DEFAULT_CATEGORIES.length === 0) {
		return;
	}

	await db.insert(categorias).values(
		DEFAULT_CATEGORIES.map((category) => ({
			name: category.name,
			type: category.type,
			icon: category.icon,
			userId,
		})),
	);
}
