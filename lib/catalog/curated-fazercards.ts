export type CuratedFazerCardsProduct = {
  gameSlug: string;
  categoryId: string;
  offerId: string;
};

const curatedGroups = [
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_global",
    offerIds: [
      "5_diamonds",
      "51_5_diamonds",
      "weekly_pass",
      "twilight_pass",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_indonesia",
    offerIds: [
      "5_diamonds",
      "53_6_diamonds",
      "weekly_pass",
      "twilight_pass",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_philippines",
    offerIds: [
      "10_1_diamonds",
      "51_5_diamonds",
      "weekly_diamond_pass",
      "504_66_diamonds",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_malaysia",
    offerIds: [
      "5_diamonds",
      "64_6_diamonds",
      "weekly_pass",
      "twilight_pass",
    ],
  },
  {
    gameSlug: "mobile-legends",
    categoryId: "mobile_legends_singapore",
    offerIds: [
      "5_diamonds",
      "64_6_diamonds",
      "weekly_pass",
      "254_30_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_bd",
    offerIds: [
      "50_diamonds",
      "115_diamonds",
      "weekly_membership",
      "monthly_membership",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_id",
    offerIds: [
      "50_diamonds",
      "100_diamonds",
      "weekly_membership",
      "monthly_membership",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_my_sg",
    offerIds: [
      "25_diamonds",
      "100_diamonds",
      "weekly_membership",
      "monthly_membership",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_ph",
    offerIds: [
      "20_diamonds",
      "100_diamonds",
      "420_diamonds",
      "1100_diamonds",
    ],
  },
  {
    gameSlug: "free-fire",
    categoryId: "free_fire_sg",
    offerIds: [
      "25_diamonds",
      "100_diamonds",
      "weekly_membership",
      "monthly_membership",
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

export function createCuratedFazerCardsProductKey(
  gameSlug: string,
  categoryId: string,
  offerId: string,
) {
  return `${gameSlug}:${categoryId}:${offerId}`;
}

const curatedProductKeys = new Set(
  curatedFazerCardsProducts.map((product) =>
    createCuratedFazerCardsProductKey(
      product.gameSlug,
      product.categoryId,
      product.offerId,
    ),
  ),
);

export function isCuratedFazerCardsProduct(input: CuratedFazerCardsProduct) {
  return curatedProductKeys.has(
    createCuratedFazerCardsProductKey(
      input.gameSlug,
      input.categoryId,
      input.offerId,
    ),
  );
}

export const curatedFazerCardsCounts = Object.freeze(
  curatedFazerCardsProducts.reduce<Record<string, number>>((counts, product) => {
    counts[product.gameSlug] = (counts[product.gameSlug] ?? 0) + 1;
    return counts;
  }, {}),
);
