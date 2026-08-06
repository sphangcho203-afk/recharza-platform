import type { MobileLegendsMarketCode } from "@/lib/mobile-legends-market";

export type CuratedFazerCardsProduct = {
  gameSlug: string;
  categoryId: string;
  offerId: string;
};

export function createCuratedFazerCardsProductKey(
  gameSlug: string,
  categoryId: string,
  offerId: string,
) {
  return `${gameSlug}:${categoryId}:${offerId}`;
}

const curatedGroups = [
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_global",
    offerIds: [
      "5_diamonds",
      "12_diamonds",
      "19_diamonds",
      "28_diamonds",
      "10_1_diamonds",
      "20_2_diamonds",
      "51_5_diamonds",
      "weekly_elite_pack",
      "weekly_pass",
      "102_10_diamonds",
      "150_15_diamonds_first_top_up_bonus",
      "203_20_diamonds",
      "250_25_diamonds_first_top_up_bonus",
      "monthly_elite_pack",
      "303_33_diamonds",
      "500_65_diamonds_first_top_up_bonus",
      "504_66_diamonds",
      "twilight_pass",
      "1007_156_diamonds",
      "2015_383_diamonds",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_indonesia",
    offerIds: [
      "5_diamonds",
      "11_1_diamonds",
      "17_2_diamonds",
      "25_3_diamonds",
      "40_4_diamonds",
      "weekly_elite_pack",
      "50_50_diamonds_first_top_up_bonus",
      "53_6_diamonds",
      "77_8_diamonds",
      "weekly_pass",
      "154_16_diamonds",
      "150_150_diamonds_first_top_up_bonus",
      "217_23_diamonds",
      "monthly_elite_pack",
      "250_250_diamonds_first_top_up_bonus",
      "256_40_diamonds",
      "367_41_diamonds",
      "503_65_diamonds",
      "twilight_pass",
      "774_101_diamonds",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_philippines",
    offerIds: [
      "10_1_diamonds",
      "20_2_diamonds",
      "51_5_diamonds",
      "50_5_diamonds_first_top_up_bonus",
      "102_10_diamonds",
      "weekly_diamond_pass",
      "150_15_diamonds_first_top_up_bonus",
      "153_15_diamonds",
      "203_20_diamonds",
      "250_25_diamonds_first_top_up_bonus",
      "303_33_diamonds",
      "504_66_diamonds",
      "500_65_diamonds_first_top_up_bonus",
      "1007_156_diamonds",
      "2015_383_diamonds",
      "5035_1007_diamonds",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_malaysia",
    offerIds: [
      "5_diamonds",
      "13_1_diamonds",
      "38_4_diamonds",
      "50_5_diamonds_first_top_up_bonus",
      "weekly_elite_pack",
      "64_6_diamonds",
      "weekly_pass",
      "127_13_diamonds",
      "150_15_diamonds_first_top_up_bonus",
      "250_25_diamonds_first_top_up_bonus",
      "monthly_elite_pack",
      "254_30_diamonds",
      "317_38_diamonds",
      "383_46_diamonds",
      "twilight_pass",
      "500_65_diamonds_first_top_up_bonus",
      "633_83_diamonds",
      "1252_194_diamonds",
      "2501_475_diamonds",
      "6252_1250_diamonds",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_singapore",
    offerIds: [
      "5_diamonds",
      "13_1_diamonds",
      "38_4_diamonds",
      "weekly_elite_pack",
      "50_5_diamonds_first_top_up_bonus",
      "64_6_diamonds",
      "weekly_pass",
      "127_13_diamonds",
      "150_15_diamonds_first_top_up_bonus",
      "monthly_elite_pack",
      "250_25_diamonds_first_top_up_bonus",
      "254_30_diamonds",
      "317_38_diamonds",
      "383_46_diamonds",
      "500_65_diamonds_first_top_up_bonus",
      "633_83_diamonds",
      "940_144_diamonds",
      "1252_194_diamonds",
      "2501_475_diamonds",
      "6252_1250_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_bd",
    offerIds: [
      "25_diamonds",
      "50_diamonds",
      "weekly_lite",
      "115_diamonds",
      "240_diamonds",
      "weekly_membership",
      "610_diamonds",
      "monthly_membership",
      "1240_diamonds",
      "2530_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_id",
    offerIds: [
      "5_diamonds",
      "25_diamonds",
      "50_diamonds",
      "100_diamonds",
      "weekly_membership",
      "280_diamonds",
      "420_diamonds",
      "monthly_membership",
      "1000_diamonds",
      "2180_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_my_sg",
    offerIds: [
      "25_diamonds",
      "weekly_lite",
      "100_diamonds",
      "weekly_membership",
      "310_diamonds",
      "520_diamonds",
      "monthly_membership",
      "1060_diamonds",
      "2180_diamonds",
      "5600_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_ph",
    offerIds: [
      "20_diamonds",
      "40_diamonds",
      "100_diamonds",
      "205_diamonds",
      "420_diamonds",
      "650_diamonds",
      "1100_diamonds",
      "2250_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_sg",
    offerIds: [
      "25_diamonds",
      "weekly_lite",
      "100_diamonds",
      "weekly_membership",
      "310_diamonds",
      "520_diamonds",
      "monthly_membership",
      "1060_diamonds",
      "2180_diamonds",
      "5600_diamonds",
    ],
  },
  {
    gameSlug: "pubg-mobile",
    categoryId: "pubg_mobile_auto",
    offerIds: [
      "prime_1_month",
      "weekly_deal_pack_1",
      "60_uc",
      "prime_3_months",
      "weekly_deal_pack_2",
      "mythic_emblem_pack",
      "325_uc",
      "prime_6_months",
      "elite_pass_lv1_50",
      "prime_plus_1_month",
      "660_uc",
      "prime_12_months",
      "elite_pass_lv1_100",
      "1800_uc",
      "prime_plus_3_months",
      "elite_pass_plus_lv1_100",
      "3850_uc",
      "prime_plus_6_months",
      "8100_uc",
      "prime_plus_12_months",
    ],
  },
  {
    gameSlug: "valorant",
    categoryId: "valorant_id",
    offerIds: ["475_vp", "1000_vp", "2050_vp", "3650_vp", "5350_vp"],
  },
  {
    gameSlug: "valorant",
    categoryId: "valorant_my",
    offerIds: ["475_vp", "1000_vp", "2050_vp", "3650_vp", "5350_vp"],
  },
  {
    gameSlug: "valorant",
    categoryId: "valorant_ph",
    offerIds: ["475_vp", "1000_vp", "2050_vp", "3650_vp", "5350_vp"],
  },
  {
    gameSlug: "valorant",
    categoryId: "valorant_sg",
    offerIds: ["475_vp", "1000_vp", "2050_vp", "3650_vp", "5350_vp"],
  },
  {
    gameSlug: "genshin-impact",
    categoryId: "genshin_impact_global",
    offerIds: [
      "60_chronal_nexus",
      "60_genesis_crystals",
      "300_30_chronal_nexus",
      "300_30_genesis_crystals",
      "blessing_of_the_welkin_moon",
      "980_110_chronal_nexus",
      "980_110_genesis_crystals",
      "1980_260_chronal_nexus",
      "1980_260_genesis_crystals",
      "3280_600_chronal_nexus",
      "3280_600_genesis_crystals",
      "6480_1600_chronal_nexus",
      "6480_1600_genesis_crystals",
    ],
  },
] as const;

export const curatedFazerCardsProducts: CuratedFazerCardsProduct[] =
  curatedGroups.flatMap((group) =>
    group.offerIds.map((offerId) => ({
      gameSlug: group.gameSlug,
      categoryId: group.categoryId,
      offerId,
    })),
  );

const curatedProductKeys = new Set(
  curatedFazerCardsProducts.map((product) =>
    createCuratedFazerCardsProductKey(
      product.gameSlug,
      product.categoryId,
      product.offerId,
    ),
  ),
);

const mobileLegendsCategoryMarkets: Record<
  string,
  readonly MobileLegendsMarketCode[]
> = {
  mobile_legends_global: ["global"],
  mobile_legends_indonesia: ["indonesia"],
  mobile_legends_philippines: ["philippines"],
  mobile_legends_malaysia: ["malaysia"],
  mobile_legends_singapore: ["singapore"],
};

const mobileLegendsOfferMarketOverrides = new Map<
  string,
  readonly MobileLegendsMarketCode[]
>([
  [
    createCuratedFazerCardsProductKey(
      "mobile-legends",
      "mobile_legends_global",
      "5_diamonds",
    ),
    ["global", "philippines"],
  ],
  [
    createCuratedFazerCardsProductKey(
      "mobile-legends",
      "mobile_legends_global",
      "12_diamonds",
    ),
    ["global", "philippines"],
  ],
  [
    createCuratedFazerCardsProductKey(
      "mobile-legends",
      "mobile_legends_global",
      "19_diamonds",
    ),
    ["global", "philippines"],
  ],
  [
    createCuratedFazerCardsProductKey(
      "mobile-legends",
      "mobile_legends_global",
      "28_diamonds",
    ),
    ["global", "philippines"],
  ],
]);

export function isCuratedFazerCardsProduct(input: CuratedFazerCardsProduct) {
  return curatedProductKeys.has(
    createCuratedFazerCardsProductKey(
      input.gameSlug,
      input.categoryId,
      input.offerId,
    ),
  );
}

export function isCuratedFazerCardsProductAvailableForMobileLegendsMarket(
  input: Pick<CuratedFazerCardsProduct, "categoryId" | "offerId">,
  marketCode: MobileLegendsMarketCode,
) {
  const key = createCuratedFazerCardsProductKey(
    "mobile-legends",
    input.categoryId,
    input.offerId,
  );

  if (!curatedProductKeys.has(key)) return false;

  const overrideMarkets = mobileLegendsOfferMarketOverrides.get(key);
  if (overrideMarkets) return overrideMarkets.includes(marketCode);

  return Boolean(
    mobileLegendsCategoryMarkets[input.categoryId]?.includes(marketCode),
  );
}

export const curatedFazerCardsCounts = Object.freeze(
  curatedFazerCardsProducts.reduce<Record<string, number>>((counts, product) => {
    counts[product.gameSlug] = (counts[product.gameSlug] ?? 0) + 1;
    return counts;
  }, {}),
);
