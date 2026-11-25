import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { touchInput, resetTouchInput } from '../systems/gameInput';

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export function MobileControls() {
  const [touchDevice, setTouchDevice] = useState(false);
  const stickPointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setTouchDevice(navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches);
    return () => resetTouchInput();
  }, []);

  const moveStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stickPointer.current !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) * 0.34;
    touchInput.moveX = clamp((event.clientX - (bounds.left + bounds.width / 2)) / radius);
    touchInput.moveY = clamp(-((event.clientY - (bounds.top + bounds.height / 2)) / radius));
  };

  const startStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    stickPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveStick(event);
  };

  const endStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stickPointer.current !== event.pointerId) return;
    stickPointer.current = null;
    touchInput.moveX = 0;
    touchInput.moveY = 0;
  };

  const startLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    lookPointer.current = event.pointerId;
    lastLook.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return;
    touchInput.lookDx += event.clientX - lastLook.current.x;
    touchInput.lookDy += event.clientY - lastLook.current.y;
    lastLook.current = { x: event.clientX, y: event.clientY };
  };

  const endLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current === event.pointerId) lookPointer.current = null;
  };

  const hold = (action: 'fire' | 'aim' | 'run' | 'jump' | 'interact' | 'reload') => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      touchInput[action] = true;
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      touchInput[action] = false;
    },
    onPointerCancel: () => { touchInput[action] = false; },
    onLostPointerCapture: () => { touchInput[action] = false; },
    onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  if (!touchDevice) return null;

  return <>
    <div className="mobile-orientation-warning" role="status">
      <span className="mobile-rotate-icon" aria-hidden="true">↻</span>
      <strong>Gire o celular</strong>
      <span>FAZ O L é melhor na horizontal</span>
    </div>
    <div className="mobile-controls" aria-label="Controles por toque">
      <div className="mobile-look-zone" aria-label="Arraste para controlar a câmera" onPointerDown={startLook} onPointerMove={moveLook} onPointerUp={endLook} onPointerCancel={endLook} />
      <div className="mobile-stick" aria-label="Analógico virtual para movimentar" onPointerDown={startStick} onPointerMove={moveStick} onPointerUp={endStick} onPointerCancel={endStick}>
        <span className="mobile-stick-knob" />
        <span className="mobile-stick-label">MOVER</span>
      </div>
      <div className="mobile-action-cluster">
        <button className="mobile-action mobile-fire" aria-label="Atirar" {...hold('fire')}><span>◉</span><small>ATIRAR</small></button>
        <button className="mobile-action mobile-aim" aria-label="Mirar" {...hold('aim')}><span>⌖</span><small>MIRAR</small></button>
        <button className="mobile-action mobile-run" aria-label="Correr" {...hold('run')}><span>➤</span><small>CORRER</small></button>
        <button className="mobile-action mobile-jump" aria-label="Pular" {...hold('jump')}><span>↟</span><small>PULAR</small></button>
        <button className="mobile-action mobile-interact" aria-label="Interagir ou entrar no veículo" {...hold('interact')}><span>↗</span><small>USAR</small></button>
        <button className="mobile-action mobile-reload" aria-label="Recarregar" {...hold('reload')}><span>⟳</span><small>RECARREGAR</small></button>
      </div>
      <span className="mobile-look-hint" aria-hidden="true">ARRASTE PARA OLHAR</span>
    </div>
  </>;
}
