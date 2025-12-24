import {
  RiArchiveLine,
  RiArrowLeftRightLine,
  RiBankCardLine,
  RiBankLine,
  RiCalendarEventLine,
  RiDashboardLine,
  RiFundsLine,
  RiGroupLine,
  RiLineChartLine,
  RiPriceTag3Line,
  RiSettingsLine,
  RiSparklingLine,
  RiTodoLine,
  type RemixiconComponentType,
} from "@remixicon/react";

export type SidebarSubItem = {
  title: string;
  url: string;
  avatarUrl?: string | null;
  isShared?: boolean;
  key?: string;
  icon?: RemixiconComponentType;
};

export type SidebarItem = {
  title: string;
  url: string;
  icon: RemixiconComponentType;
  isActive?: boolean;
  items?: SidebarSubItem[];
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export type SidebarNavData = {
  navMain: SidebarSection[];
  navSecondary: {
    title: string;
    url: string;
    icon: RemixiconComponentType;
  }[];
};

export interface PagadorLike {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  canEdit?: boolean;
}

export function createSidebarNavData(pagadores: PagadorLike[]): SidebarNavData {
  const pagadorItems = pagadores
    .map((pagador) => ({
      title: pagador.name?.trim().length
        ? pagador.name.trim()
        : "Pagador sem nome",
      url: `/pagadores/${pagador.id}`,
      key: pagador.canEdit ? pagador.id : `${pagador.id}-shared`,
      isShared: !pagador.canEdit,
      avatarUrl: pagador.avatarUrl,
    }))
    .sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
    );

  const pagadorItemsWithHistory: SidebarSubItem[] = pagadorItems;

  return {
    navMain: [
      {
        title: "Visão Geral",
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: RiDashboardLine,
          },
        ],
      },
      {
        title: "Gestão Financeira",
        items: [
          {
            title: "Lançamentos",
            url: "/lancamentos",
            icon: RiArrowLeftRightLine,
          },
          {
            title: "Calendário",
            url: "/calendario",
            icon: RiCalendarEventLine,
          },
          {
            title: "Cartões",
            url: "/cartoes",
            icon: RiBankCardLine,
          },
          {
            title: "Contas",
            url: "/contas",
            icon: RiBankLine,
          },
          {
            title: "Orçamentos",
            url: "/orcamentos",
            icon: RiFundsLine,
          },
        ],
      },
      {
        title: "Organização",
        items: [
          {
            title: "Pagadores",
            url: "/pagadores",
            icon: RiGroupLine,
            items: pagadorItemsWithHistory,
          },
          {
            title: "Categorias",
            url: "/categorias",
            icon: RiPriceTag3Line,
            items: [
              {
                title: "Histórico",
                url: "/categorias/historico",
                key: "historico-categorias",
                icon: RiLineChartLine,
              },
            ],
          },
        ],
      },
      {
        title: "Análise e Anotações",
        items: [
          {
            title: "Anotações",
            url: "/anotacoes",
            icon: RiTodoLine,
            items: [
              {
                title: "Arquivadas",
                url: "/anotacoes/arquivadas",
                key: "anotacoes-arquivadas",
                icon: RiArchiveLine,
              },
            ],
          },
          {
            title: "Insights",
            url: "/insights",
            icon: RiSparklingLine,
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Ajustes",
        url: "/ajustes",
        icon: RiSettingsLine,
      },
    ],
  };
}
