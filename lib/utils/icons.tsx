import * as RemixIcons from "@remixicon/react";
import type { ComponentType, ReactNode } from "react";

const ICON_CLASS = "h-4 w-4";

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getIconComponent = (
  iconName: string
): ComponentType<{ className?: string }> | null => {
  // Busca o ícone no objeto de ícones do Remix Icon
  const icon = (RemixIcons as Record<string, unknown>)[iconName];

  if (icon && typeof icon === "function") {
    return icon as ComponentType<{ className?: string }>;
  }

  return null;
};

export const getConditionIcon = (condition: string): ReactNode => {
  const key = normalizeKey(condition);

  const registry: Record<string, ReactNode> = {
    parcelado: <RemixIcons.RiLoader2Fill className={ICON_CLASS} aria-hidden />,
    recorrente: <RemixIcons.RiRefreshLine className={ICON_CLASS} aria-hidden />,
    avista: <RemixIcons.RiCheckLine className={ICON_CLASS} aria-hidden />,
    vista: <RemixIcons.RiCheckLine className={ICON_CLASS} aria-hidden />,
  };

  return registry[key] ?? null;
};

export const getPaymentMethodIcon = (paymentMethod: string): ReactNode => {
  const key = normalizeKey(paymentMethod);

  const registry: Record<string, ReactNode> = {
    dinheiro: (
      <RemixIcons.RiMoneyDollarCircleLine className={ICON_CLASS} aria-hidden />
    ),
    pix: <RemixIcons.RiPixLine className={ICON_CLASS} aria-hidden />,
    boleto: <RemixIcons.RiBarcodeLine className={ICON_CLASS} aria-hidden />,
    credito: (
      <RemixIcons.RiMoneyDollarCircleLine className={ICON_CLASS} aria-hidden />
    ),
    cartaodecredito: (
      <RemixIcons.RiBankCard2Line className={ICON_CLASS} aria-hidden />
    ),
    cartaodedebito: (
      <RemixIcons.RiBankCard2Line className={ICON_CLASS} aria-hidden />
    ),
    debito: <RemixIcons.RiBankCard2Line className={ICON_CLASS} aria-hidden />,
    prepagovrva: <RemixIcons.RiCouponLine className={ICON_CLASS} aria-hidden />,
    transferenciabancaria: (
      <RemixIcons.RiExchangeLine className={ICON_CLASS} aria-hidden />
    ),
  };

  return registry[key] ?? null;
};
