/**
 * Category icon options and utilities
 *
 * Consolidated from:
 * - /lib/category-icons.ts
 */

export type CategoryIconOption = {
  label: string;
  value: string;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // Finanças
  { label: "Dinheiro", value: "RiMoneyDollarCircleLine" },
  { label: "Carteira", value: "RiWallet3Line" },
  { label: "Carteira 2", value: "RiWalletLine" },
  { label: "Cartão", value: "RiBankCard2Line" },
  { label: "Banco", value: "RiBankLine" },
  { label: "Moedas", value: "RiHandCoinLine" },
  { label: "Gráfico", value: "RiLineChartLine" },
  { label: "Ações", value: "RiStockLine" },
  { label: "Troca", value: "RiExchangeLine" },
  { label: "Reembolso", value: "RiRefundLine" },
  { label: "Recompensa", value: "RiRefund2Line" },
  { label: "Leilão", value: "RiAuctionLine" },

  // Compras
  { label: "Carrinho", value: "RiShoppingCartLine" },
  { label: "Sacola", value: "RiShoppingBagLine" },
  { label: "Cesta", value: "RiShoppingBasketLine" },
  { label: "Presente", value: "RiGiftLine" },
  { label: "Cupom", value: "RiCouponLine" },
  { label: "Ticket", value: "RiTicket2Line" },

  // Alimentação
  { label: "Restaurante", value: "RiRestaurantLine" },
  { label: "Garfo e faca", value: "RiRestaurant2Line" },
  { label: "Café", value: "RiCupLine" },
  { label: "Bebida", value: "RiDrinksFill" },
  { label: "Pizza", value: "RiCake3Line" },
  { label: "Cerveja", value: "RiBeerLine" },

  // Transporte
  { label: "Ônibus", value: "RiBusLine" },
  { label: "Carro", value: "RiCarLine" },
  { label: "Táxi", value: "RiTaxiLine" },
  { label: "Moto", value: "RiMotorbikeLine" },
  { label: "Avião", value: "RiFlightTakeoffLine" },
  { label: "Navio", value: "RiShipLine" },
  { label: "Trem", value: "RiTrainLine" },
  { label: "Metrô", value: "RiSubwayLine" },
  { label: "Bicicleta", value: "RiBikeLine" },
  { label: "Mapa", value: "RiMapPinLine" },
  { label: "Combustível", value: "RiGasStationLine" },

  // Moradia
  { label: "Casa", value: "RiHomeLine" },
  { label: "Prédio", value: "RiBuilding2Line" },
  { label: "Apartamento", value: "RiBuildingLine" },
  { label: "Ferramentas", value: "RiToolsLine" },
  { label: "Lâmpada", value: "RiLightbulbLine" },
  { label: "Energia", value: "RiFlashlightLine" },

  // Saúde e bem-estar
  { label: "Saúde", value: "RiStethoscopeLine" },
  { label: "Hospital", value: "RiHospitalLine" },
  { label: "Coração", value: "RiHeart2Line" },
  { label: "Pulso", value: "RiHeartPulseLine" },
  { label: "Mental", value: "RiMentalHealthLine" },
  { label: "Farmácia", value: "RiFirstAidKitLine" },
  { label: "Fitness", value: "RiRunLine" },

  // Educação
  { label: "Livro", value: "RiBook2Line" },
  { label: "Graduação", value: "RiGraduationCapLine" },
  { label: "Escola", value: "RiSchoolLine" },
  { label: "Lápis", value: "RiPencilLine" },

  // Trabalho
  { label: "Maleta", value: "RiBriefcaseLine" },
  { label: "Pasta", value: "RiBriefcase4Line" },
  { label: "Escritório", value: "RiUserStarLine" },

  // Lazer
  { label: "Controle", value: "RiGamepadLine" },
  { label: "Filme", value: "RiMovie2Line" },
  { label: "Música", value: "RiMusic2Line" },
  { label: "Microfone", value: "RiMicLine" },
  { label: "Fone", value: "RiHeadphoneLine" },
  { label: "Câmera", value: "RiCameraLine" },
  { label: "Praia", value: "RiUmbrellaLine" },
  { label: "Futebol", value: "RiFootballLine" },
  { label: "Basquete", value: "RiBasketballLine" },

  // Tecnologia
  { label: "WiFi", value: "RiWifiLine" },
  { label: "Celular", value: "RiSmartphoneLine" },
  { label: "Computador", value: "RiComputerLine" },
  { label: "Monitor", value: "RiMonitorLine" },
  { label: "Teclado", value: "RiKeyboardLine" },
  { label: "Mouse", value: "RiMouseLine" },
  { label: "Fone Bluetooth", value: "RiBluetoothLine" },

  // Pessoas
  { label: "Usuário", value: "RiUserLine" },
  { label: "Grupo", value: "RiGroupLine" },
  { label: "Família", value: "RiParentLine" },
  { label: "Bebê", value: "RiBabyCarriageLine" },

  // Animais
  { label: "Pet", value: "RiBearSmileLine" },

  // Vestuário
  { label: "Camiseta", value: "RiTShirtLine" },

  // Documentos
  { label: "Arquivo", value: "RiFileTextLine" },
  { label: "Documento", value: "RiArticleLine" },
  { label: "Balança", value: "RiScales2Line" },
  { label: "Escudo", value: "RiShieldCheckLine" },

  // Serviços
  { label: "Serviço", value: "RiServiceLine" },
  { label: "Alerta", value: "RiAlertLine" },
  { label: "Troféu", value: "RiMedalLine" },

  // Outros
  { label: "Mais", value: "RiMore2Line" },
  { label: "Estrela", value: "RiStarLine" },
  { label: "Foguete", value: "RiRocketLine" },
  { label: "Ampulheta", value: "RiHourglassLine" },
  { label: "Calendário", value: "RiCalendarLine" },
  { label: "Relógio", value: "RiTimeLine" },
  { label: "Timer", value: "RiTimer2Line" },
  { label: "Fogo", value: "RiFireLine" },
  { label: "Gota", value: "RiDropLine" },
  { label: "Sol", value: "RiSunLine" },
  { label: "Lua", value: "RiMoonLine" },
  { label: "Nuvem", value: "RiCloudLine" },
  { label: "Raio", value: "RiFlashlightFill" },
  { label: "Planta", value: "RiPlantLine" },
  { label: "Árvore", value: "RiSeedlingLine" },
  { label: "Globo", value: "RiGlobalLine" },
  { label: "Localização", value: "RiMapPin2Line" },
  { label: "Bússola", value: "RiCompassLine" },
  { label: "Reciclagem", value: "RiRecycleLine" },
  { label: "Cadeado", value: "RiLockLine" },
  { label: "Chave", value: "RiKeyLine" },
  { label: "Configurações", value: "RiSettings3Line" },
  { label: "Link", value: "RiLinkLine" },
  { label: "Anexo", value: "RiAttachmentLine" },
  { label: "Download", value: "RiDownloadLine" },
  { label: "Upload", value: "RiUploadLine" },
  { label: "Nuvem Download", value: "RiCloudDownloadLine" },
  { label: "Nuvem Upload", value: "RiCloudUploadLine" },
];

/**
 * Gets all available category icon options
 * @returns Array of icon options
 */
export function getCategoryIconOptions() {
  return CATEGORY_ICON_OPTIONS;
}

/**
 * Gets the default icon for a category type
 * @returns Default icon value
 */
export function getDefaultIconForType() {
  return CATEGORY_ICON_OPTIONS[0]?.value ?? "";
}
