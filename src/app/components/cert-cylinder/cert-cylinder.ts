import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, computed, effect, inject, input, signal, viewChild, viewChildren } from '@angular/core';
import { CylinderCert, SAMPLE_CYLINDER_CERTS } from './cert-cylinder.data';

const CARD_WIDTH = 168;
const GAP = 16;
const TILT = -9;           // grados de rotateX: se ve ligeramente desde arriba
const AUTO_SPEED = -0.08;  // grados por frame
const DRAG_FACTOR = 0.25;  // grados por píxel arrastrado
const WHEEL_FACTOR = 0.25;
const FRICTION = 0.94;
const MAX_VELOCITY = 8;
const SNAP_EASE = 0.12;
const CLICK_SLOP = 5;      // px: por debajo, el gesto es un clic y no un arrastre
const FLICK_WINDOW = 80;   // ms: si el puntero se paró antes de soltar, no hay inercia
const STAGE_HEIGHT = 340;

/** Radio para que n tarjetas queden pegadas sin solaparse. */
export function radiusFor(n: number, cardWidth = CARD_WIDTH, gap = GAP): number {
  return n < 3 ? cardWidth : (cardWidth + gap) / (2 * Math.tan(Math.PI / n));
}

/** 1 si la tarjeta i mira al frente, -1 si está detrás. */
export function faceFor(i: number, n: number, angle: number): number {
  return Math.cos((((360 / n) * i + angle) * Math.PI) / 180);
}

/** Diferencia de ángulo llevada a [-180, 180) para girar por el camino más corto. */
export function shortestDelta(delta: number): number {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

@Component({
  selector: 'app-cert-cylinder',
  templateUrl: './cert-cylinder.html',
  styleUrl: './cert-cylinder.scss',
  host: { '[class.is-dragging]': 'dragging()' }
})
export class CertCylinder {
  certifications = input<CylinderCert[]>(SAMPLE_CYLINDER_CERTS);
  label = input('Certificaciones');

  front = signal(0);
  paused = signal(false);
  dragging = signal(false);
  protected hovered = signal(false);
  protected focused = signal(false);
  private hidden = signal(false);
  private reducedMotion = signal(false);
  autoRotating = computed(
    () => !this.paused() && !this.hovered() && !this.focused() && !this.hidden() && !this.reducedMotion()
  );

  count = computed(() => this.certifications().length);
  step = computed(() => 360 / this.count());
  radius = computed(() => radiusFor(this.count()));
  current = computed(() => this.certifications()[this.front()]);

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private ring = viewChild.required<ElementRef<HTMLElement>>('ring');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');

  // Estado del bucle: campos normales, no signals, para no disparar detección de cambios en cada frame.
  angle = 0;
  private velocity = 0;
  private target: number | null = null;
  private scale = 1;
  private frame = 0;
  private visible = true;
  private ready = false;
  private pointer?: { id: number; startX: number; lastX: number; lastTime: number; moved: number };

  private zone = inject(NgZone);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.ready = true;
      const stage = this.stage().nativeElement;

      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      const syncMotion = () => this.reducedMotion.set(!!mq?.matches);
      syncMotion();
      mq?.addEventListener('change', syncMotion);

      const syncVisibility = () => this.hidden.set(document.hidden);
      document.addEventListener('visibilitychange', syncVisibility);

      const ro = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(([entry]) => this.resize(entry.contentRect.width))
        : undefined;
      ro?.observe(stage);

      // Fuera de pantalla no hace falta animar nada.
      const io = typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            this.visible = entry.isIntersecting;
            this.wake();
          })
        : undefined;
      io?.observe(stage);

      this.resize(stage.clientWidth);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.frame);
        mq?.removeEventListener('change', syncMotion);
        document.removeEventListener('visibilitychange', syncVisibility);
        ro?.disconnect();
        io?.disconnect();
      });
    });

    // Al reanudar el autogiro (fin de hover, botón, pestaña visible) hay que volver a arrancar el bucle.
    effect(() => {
      if (this.autoRotating()) this.wake();
    });
  }

  cardTransform(i: number): string {
    return `rotateY(${this.step() * i}deg) translateZ(${this.radius()}px)`;
  }

  next() {
    this.snapBy(1);
  }

  prev() {
    this.snapBy(-1);
  }

  togglePause() {
    this.paused.update(p => !p);
  }

  bringToFront(i: number) {
    this.animateTo(this.angle + shortestDelta(-i * this.step() - this.angle));
  }

  openFront() {
    const url = this.current()?.credentialUrl;
    if (url) window.open(url, '_blank', 'noopener');
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.next();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'Enter') this.openFront();
    else return;
    event.preventDefault();
  }

  onWheel(event: WheelEvent) {
    // Solo el scroll horizontal gira el anillo; el vertical sigue moviendo la página.
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    this.target = null;
    this.velocity = 0;
    this.angle -= event.deltaX * WHEEL_FACTOR;
    this.render();
    this.wake();
  }

  onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    this.pointer = { id: event.pointerId, startX: event.clientX, lastX: event.clientX, lastTime: event.timeStamp, moved: 0 };
    this.target = null;
    this.velocity = 0;
    this.stage().nativeElement.setPointerCapture(event.pointerId);
    this.dragging.set(true);
  }

  onPointerMove(event: PointerEvent) {
    const p = this.pointer;
    if (!p || event.pointerId !== p.id) return;
    const delta = (event.clientX - p.lastX) * DRAG_FACTOR;
    p.lastX = event.clientX;
    p.lastTime = event.timeStamp;
    p.moved = Math.max(p.moved, Math.abs(event.clientX - p.startX));
    this.angle += delta;
    this.velocity = clamp(delta, MAX_VELOCITY);
    this.render();
  }

  onPointerUp(event: PointerEvent, cancelled = false) {
    const p = this.pointer;
    if (!p || event.pointerId !== p.id) return;
    this.pointer = undefined;
    this.dragging.set(false);

    if (!cancelled && p.moved < CLICK_SLOP) {
      this.velocity = 0;
      // Con la captura del puntero el evento llega al stage: buscamos la tarjeta bajo el puntero.
      const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-index]');
      if (hit) {
        const i = Number(hit.dataset['index']);
        if (i === this.front()) this.openFront();
        else this.bringToFront(i);
      }
      return;
    }

    if (cancelled || this.reducedMotion() || event.timeStamp - p.lastTime > FLICK_WINDOW) this.velocity = 0;
    if (this.reducedMotion()) this.bringToFront(this.front());
    this.wake();
  }

  private snapBy(dir: 1 | -1) {
    const step = this.step();
    const base = this.target ?? this.angle;
    const k = Math.round(-base / step) + dir;
    this.animateTo(-k * step);
  }

  private animateTo(angle: number) {
    this.velocity = 0;
    if (this.reducedMotion()) {
      this.target = null;
      this.angle = angle;
      this.render();
      return;
    }
    this.target = angle;
    this.wake();
  }

  private resize(width: number) {
    this.scale = Math.min(1, width / (this.radius() * 2.1));
    this.viewport().nativeElement.style.height = `${Math.round(Math.max(220, STAGE_HEIGHT * this.scale))}px`;
    this.render();
  }

  private wake() {
    if (!this.ready || this.frame || !this.visible) return;
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame(this.tick);
    });
  }

  private tick = () => {
    this.frame = 0;
    const moving = this.advance();
    this.render();
    if (moving) this.wake();
  };

  /** Avanza un frame. Devuelve si hay que seguir animando. */
  private advance(): boolean {
    if (this.pointer) return false; // durante el arrastre se renderiza en pointermove

    if (this.target !== null) {
      const d = this.target - this.angle;
      if (Math.abs(d) < 0.05) {
        this.angle = this.target;
        this.target = null;
      } else {
        this.angle += d * SNAP_EASE;
      }
      return true;
    }

    if (Math.abs(this.velocity) > 0.02) {
      this.angle += this.velocity;
      this.velocity *= FRICTION;
      return true;
    }
    this.velocity = 0;

    if (this.autoRotating()) {
      this.angle += AUTO_SPEED;
      return true;
    }
    return false;
  }

  // Solo transform y opacity: nada que obligue a recalcular el layout ni a repintar.
  private render() {
    if (!this.ready) return;
    const n = this.count();
    this.ring().nativeElement.style.transform =
      `scale(${this.scale}) translateZ(${-this.radius()}px) rotateX(${TILT}deg) rotateY(${this.angle}deg)`;

    let best = 0;
    let bestFace = -Infinity;
    this.cards().forEach((ref, i) => {
      const face = faceFor(i, n, this.angle);
      const lit = Math.max(0, face);
      const card = ref.nativeElement;
      card.style.opacity = (0.25 + 0.75 * lit).toFixed(3);
      // Equivale a filter: brightness(0.55 + 0.45 * lit), pero cambiar la opacidad de una capa negra
      // no obliga a repintar la tarjeta (con filter + sombras se repintaban todas en cada frame).
      (card.lastElementChild as HTMLElement).style.opacity = (0.45 * (1 - lit)).toFixed(3);
      if (face > bestFace) {
        bestFace = face;
        best = i;
      }
    });

    if (best !== this.front()) this.front.set(best);
  }
}
