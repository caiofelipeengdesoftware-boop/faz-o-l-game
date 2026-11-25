import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useGameStore } from '../state';
import { getControllerSettings } from './controllerSettings';

/** Normalized action map. Physical keys/buttons are translated here only. */
export const gameInput = {
  enabled: false,
  moveX: 0, moveY: 0, lookX: 0, lookY: 0,
  run: false, jumpPressed: false, interactPressed: false, missionPressed: false,
  vehiclePressed: false, mapPressed: false, questPressed: false,
  fire: false, brake: false, handbrake: false, aim: false, cover: false, crouchPressed: false,
  meleePressed: false, reloadPressed: false, weaponWheel: false, lookBack: false,
  horn: false, radioPressed: false, headlightsPressed: false,
  throttle: 0, reverse: 0, cameraPressed: false, pausePressed: false, interactionClaimed: false,
};

function clearInput() {
  Object.assign(gameInput, {
    enabled: false, moveX: 0, moveY: 0, lookX: 0, lookY: 0, run: false, jumpPressed: false,
    interactPressed: false, missionPressed: false, vehiclePressed: false, mapPressed: false, questPressed: false,
    fire: false, brake: false, handbrake: false, aim: false, cover: false, crouchPressed: false,
    meleePressed: false, reloadPressed: false, weaponWheel: false, lookBack: false, horn: false,
    radioPressed: false, headlightsPressed: false, throttle: 0, reverse: 0, cameraPressed: false,
    pausePressed: false, interactionClaimed: false,
  });
}

export function consumeInteraction() {
  if (!gameInput.interactPressed || gameInput.interactionClaimed) return false;
  gameInput.interactionClaimed = true;
  return true;
}

export function InputManager({ enabled }: { enabled: boolean }) {
  const keys = useRef(new Set<string>());
  const mouse = useRef({ fire: false, aim: false, dx: 0, dy: 0 });
  const was = useRef({ jump: false, interact: false, mission: false, reload: false, vehicle: false, map: false, camera: false, pause: false, quest: false, crouch: false, melee: false, headlights: false, radio: false });
  const smooth = useRef({ x: 0, y: 0 });
  const lastConnectionUpdate = useRef(0);

  useEffect(() => {
    const markPc = () => useGameStore.getState().setInputDevice('keyboardMouse');
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
      keys.current.add(key); markPc();
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const mouseDown = (event: MouseEvent) => { if (event.button === 0) mouse.current.fire = true; if (event.button === 2) mouse.current.aim = true; markPc(); };
    const mouseUp = (event: MouseEvent) => { if (event.button === 0) mouse.current.fire = false; if (event.button === 2) mouse.current.aim = false; };
    const mouseMove = (event: MouseEvent) => { markPc(); if (document.pointerLockElement) { mouse.current.dx += event.movementX; mouse.current.dy += event.movementY; } };
    const contextMenu = (event: MouseEvent) => event.preventDefault();
    const clear = () => { keys.current.clear(); mouse.current.fire = false; mouse.current.aim = false; smooth.current = { x: 0, y: 0 }; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('mousedown', mouseDown); window.addEventListener('mouseup', mouseUp); window.addEventListener('mousemove', mouseMove);
    window.addEventListener('blur', clear); window.addEventListener('contextmenu', contextMenu);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', mouseDown); window.removeEventListener('mouseup', mouseUp); window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('blur', clear); window.removeEventListener('contextmenu', contextMenu);
    };
  }, []);

  useFrame((_, delta) => {
    gameInput.interactionClaimed = false;
    gameInput.enabled = enabled;
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find((candidate) => candidate?.connected) ?? null;
    lastConnectionUpdate.current += delta;
    if (lastConnectionUpdate.current > 0.5) {
      useGameStore.getState().setControllerConnected(pad?.id ?? '');
      lastConnectionUpdate.current = 0;
    }
    if (!enabled) {
      clearInput();
      was.current = { jump: false, interact: false, mission: false, reload: false, vehicle: false, map: false, camera: false, pause: false, quest: false, crouch: false, melee: false, headlights: false, radio: false };
      return;
    }

    const pressed = keys.current;
    const axes = pad?.axes ?? [];
    const buttons = pad?.buttons ?? [];
    const config = getControllerSettings();
    const rawAxis = (value = 0) => Math.abs(value) < config.deadzone ? 0 : Math.sign(value) * ((Math.abs(value) - config.deadzone) / (1 - config.deadzone));
    const button = (index: number) => Boolean(buttons[index]?.pressed || (buttons[index]?.value ?? 0) > 0.55);
    const trigger = (index: number) => Math.max(buttons[index]?.pressed ? 1 : 0, buttons[index]?.value ?? 0);
    const driving = useGameStore.getState().isDriving;
    const rawX = rawAxis(axes[2]) * config.sensitivity + (delta > 0 ? mouse.current.dx / delta * 0.002 * config.mouseSensitivity : 0);
    const rawY = rawAxis(axes[3]) * config.sensitivity * (config.invertY ? -1 : 1) + (delta > 0 ? mouse.current.dy / delta * 0.002 * config.mouseSensitivity : 0);
    smooth.current.x = MathUtils.damp(smooth.current.x, rawX, 18, Math.min(delta, 0.05));
    smooth.current.y = MathUtils.damp(smooth.current.y, rawY, 18, Math.min(delta, 0.05));
    mouse.current.dx = 0; mouse.current.dy = 0;

    const jump = pressed.has(' ') || (!driving && button(2));
    const interact = pressed.has('e') || button(3);
    const vehicle = pressed.has('f') || button(3);
    const map = pressed.has('m') || pressed.has('z') || (!driving && button(8));
    const quest = pressed.has('j') || button(12);
    const camera = pressed.has('v') || (driving && button(8));
    const pause = pressed.has('escape') || pressed.has('p') || button(9);
    const crouch = pressed.has('control') || (!driving && button(10));
    const headlights = pressed.has('h') || (driving && button(15));
    const radio = driving && (pressed.has('q') || button(14));
    const phase = useGameStore.getState().missionPhase;
    const melee = pressed.has('q') && !driving && phase === 'shootout';
    const reload = pressed.has('r') || (!driving && button(1));

    gameInput.moveX = MathUtils.clamp(Number(pressed.has('d')) - Number(pressed.has('a')) + rawAxis(axes[0]), -1, 1);
    gameInput.moveY = MathUtils.clamp(Number(pressed.has('w')) - Number(pressed.has('s')) - rawAxis(axes[1]), -1, 1);
    gameInput.lookX = smooth.current.x;
    gameInput.lookY = smooth.current.y;
    gameInput.run = pressed.has('shift') || button(0);
    gameInput.jumpPressed = jump && !was.current.jump;
    gameInput.interactPressed = interact && !was.current.interact;
    gameInput.missionPressed = gameInput.interactPressed;
    gameInput.reloadPressed = reload && !was.current.reload;
    gameInput.vehiclePressed = vehicle && !was.current.vehicle;
    gameInput.mapPressed = map && !was.current.map;
    gameInput.questPressed = quest && !was.current.quest;
    gameInput.cameraPressed = camera && !was.current.camera;
    gameInput.pausePressed = pause && !was.current.pause;
    gameInput.crouchPressed = crouch && !was.current.crouch;
    gameInput.meleePressed = melee && !was.current.melee;
    gameInput.headlightsPressed = headlights && !was.current.headlights;
    gameInput.radioPressed = radio && !was.current.radio;
    if (gameInput.reloadPressed) useGameStore.getState().reloadAmmo();
    if (gameInput.mapPressed) useGameStore.getState().toggleMap();
    if (gameInput.questPressed) useGameStore.getState().toggleQuestBoard();
    if (gameInput.cameraPressed) useGameStore.getState().toggleCamera();
    if (gameInput.pausePressed) useGameStore.getState().requestPause();
    if (gameInput.crouchPressed) useGameStore.getState().toggleCrouch();
    if (gameInput.headlightsPressed) useGameStore.getState().toggleHeadlights();
    if (gameInput.radioPressed) useGameStore.getState().cycleRadio();
    gameInput.fire = mouse.current.fire || trigger(7) > 0.16;
    gameInput.aim = mouse.current.aim || trigger(6) > 0.16;
    gameInput.brake = pressed.has('s') || (driving && trigger(6) > 0.16);
    gameInput.handbrake = pressed.has(' ') || (driving && (button(5) || button(0)));
    gameInput.cover = !driving && (button(5) || (pressed.has('q') && phase !== 'shootout'));
    gameInput.weaponWheel = pressed.has('tab') || button(4);
    gameInput.lookBack = pressed.has('c') || button(11);
    gameInput.horn = (driving && pressed.has('e')) || (driving && button(10));
    gameInput.throttle = Math.max(Number(pressed.has('w')) * 0.85, trigger(7));
    gameInput.reverse = Math.max(Number(pressed.has('s')) * 0.6, trigger(6));
    if (pad && ([...axes].some((value) => Math.abs(value) > config.deadzone) || pad.buttons.some((item) => item.pressed))) useGameStore.getState().setInputDevice('gamepad');
    was.current = { jump, interact, mission: gameInput.missionPressed, reload, vehicle, map, camera, pause, quest, crouch, melee, headlights, radio };
  });
  return null;
}
