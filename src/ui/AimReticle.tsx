import { useEffect, useState } from 'react';
import { gameInput } from '../systems/gameInput';

export function AimReticle() {
  const [aiming, setAiming] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setAiming(gameInput.aim), 60);
    return () => window.clearInterval(timer);
  }, []);
  return aiming ? <div className="aim-reticle aim-reticle-active" aria-label="Mira" aria-hidden="true"><i /><i /><b /></div> : null;
}
