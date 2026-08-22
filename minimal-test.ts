
const SHOP2TOPUP_API_KEY = process.env.SHOP2TOPUP_API_KEY;
const VOLSEVER_API_KEY = process.env.VOLSEVER_API_KEY;

async function testShop2TopUp() {
  console.log('Testing Shop2TopUp...');
  const response = await fetch('https://shop2topup.com/api/endpoints/v1/player/validate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SHOP2TOPUP_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; RecharzaTopup/1.0)',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sub_category_id: 28,
      player_id: '1548126076',
      zone_id: '16506'
    })
  });
  const data = await response.json();
  console.log('Shop2TopUp Result:', JSON.stringify(data, null, 2));
}

async function testVolsever() {
  console.log('\nTesting Volsever...');
  const response = await fetch('https://gate.volsever.com/proxy/api/game/mobile-legends-wr?id=1548126076&zone=16506', {
    headers: {
      'Accept': 'application/json',
      'X-API-Key': VOLSEVER_API_KEY
    }
  });
  const data = await response.json();
  console.log('Volsever Result:', JSON.stringify(data, null, 2));
}

async function run() {
  await testShop2TopUp();
  await testVolsever();
}

run().catch(console.error);
