
import { validateMobileLegendsIdentity } from './lib/player-identity-provider';

async function test() {
  console.log('Testing Mobile Legends Identity Verification...');
  console.log('Player ID: 1548126076, Zone ID: 16506');
  
  try {
    const result = await validateMobileLegendsIdentity({ 
      playerId: '1548126076', 
      zoneId: '16506' 
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

test();
