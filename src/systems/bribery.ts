export type BribeChoice = 'accept' | 'refuse' | 'denounce' | 'feign';
export interface BribeOffer { id: string; amount: number; description: string; }
export interface BribeResult { corruptionDelta: number; assetsDelta: number; reputationDelta: number; flags: string[]; }

export function resolveBribe(choice: BribeChoice, offer: BribeOffer): BribeResult {
  switch (choice) {
    case 'accept': return { corruptionDelta: offer.amount * 0.1, assetsDelta: offer.amount, reputationDelta: -10, flags: ['accepted_bribe'] };
    case 'refuse': return { corruptionDelta: 0, assetsDelta: 0, reputationDelta: 2, flags: ['refused_bribe'] };
    case 'denounce': return { corruptionDelta: -5, assetsDelta: 0, reputationDelta: 5, flags: ['denounced_bribe'] };
    case 'feign': return { corruptionDelta: 2, assetsDelta: 0, reputationDelta: -2, flags: ['feigned_acceptance'] };
  }
}
