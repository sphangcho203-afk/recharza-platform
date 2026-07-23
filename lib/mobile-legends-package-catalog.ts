const preferredPackagePatterns = [
  /limited[- ]time value pack/i,
  /5 diamonds/i,
  /10\s*\+\s*1 diamonds/i,
  /14 diamonds/i,
  /20\s*\+\s*2 diamonds/i,
  /42 diamonds/i,
  /50\s*\+\s*5 diamonds/i,
  /51\s*\+\s*5 diamonds/i,
  /70 diamonds/i,
  /78.*8/i,
  /86 diamonds/i,
  /weekly elite pack/i,
  /weekly diamond pass|weekly pass|^weekly$/i,
  /102\s*\+\s*10 diamonds/i,
  /140 diamonds/i,
  /150\s*\+\s*15 diamonds/i,
  /156.*16/i,
  /172 diamonds/i,
  /203\s*\+\s*20 diamonds/i,
  /234.*23/i,
  /250\s*\+\s*25 diamonds/i,
  /257 diamonds/i,
  /303\s*\+\s*33 diamonds/i,
  /355 diamonds/i,
  /429 diamonds/i,
  /500.*65/i,
  /504\s*\+\s*66 diamonds/i,
  /565 diamonds/i,
  /625.*81/i,
  /716 diamonds/i,
  /twilight pass|^twilight$/i,
] as const;

export const targetMobileLegendsPackageCount = 30;

export function getMobileLegendsPackagePriority(name: string) {
  const index = preferredPackagePatterns.findIndex((pattern) => pattern.test(name));
  return index === -1 ? preferredPackagePatterns.length + 100 : index;
}

export function prioritizeMobileLegendsPackages<T extends { name: string; amountInPaise: number }>(
  packages: T[],
  limit = targetMobileLegendsPackageCount,
) {
  return [...packages]
    .sort((left, right) => {
      const priorityDifference =
        getMobileLegendsPackagePriority(left.name) - getMobileLegendsPackagePriority(right.name);
      if (priorityDifference !== 0) return priorityDifference;
      if (left.amountInPaise !== right.amountInPaise) return left.amountInPaise - right.amountInPaise;
      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}
