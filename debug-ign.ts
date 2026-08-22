import { lookupVolseverGameIdentity } from "./lib/volsever";
import { lookupShop2TopUpPlayerIdentity } from "./lib/suppliers/shop2topup";

async function debug() {
  const playerId = "1548126076";
  const zoneId = "16506";

  console.log("--- Debugging IGN Verification ---");
  console.log(`Player ID: ${playerId}, Zone ID: ${zoneId}`);

  try {
    console.log("\n1. Testing Shop2TopUp...");
    const s2s = await lookupShop2TopUpPlayerIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    console.log("Shop2TopUp Status:", s2s.status);
    console.log("Shop2TopUp Result:", JSON.stringify(s2s.result, null, 2));
  } catch (e: any) {
    console.log("Shop2TopUp Error:", e.message);
  }

  try {
    console.log("\n2. Testing Volsever (mobile-legends-wr)...");
    const volsever = await lookupVolseverGameIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    console.log("Volsever Result:", JSON.stringify(volsever, null, 2));
  } catch (e: any) {
    console.log("Volsever Error:", e.message);
  }
}

debug();
