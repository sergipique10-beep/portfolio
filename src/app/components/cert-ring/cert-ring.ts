import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, signal, viewChild, viewChildren } from '@angular/core';
import { Certification, SAMPLE_CERTIFICATIONS } from './cert-ring.data';
import { TOP, angleFor, nearestIndex, normalizeDelta, pointerAngle, rotationFor, wrapIndex } from './ring-math';

const ACTIVE_SCALE = 1.25;
const DRAG_THRESHOLD = 4; // grados antes de considerar que es un arrastre y no un clic
const WHEEL_COOLDOWN = 400;
const AUTOPLAY_MS = 4000;

@Component({
  selector: 'app-cert-ring',
  templateUrl: './cert-ring.html',
  styleUrl: './cert-ring.scss',
  host: {
    '[style.--badge]': "badgeSize() + 'px'",
    '[class.is-dragging]': 'dragging()',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'onFocusOut($event)'
  }
})
export class CertRing {
  certifications = input<Certification[]>(SAMPLE_CERTIFICATIONS);
  autoplay = input(false);
  label = input('Certificaciones');

  active = signal(0);
  rotation = signal(TOP);
  dragging = signal(false);
  protected hovered = signal(false);
  protected focused = signal(false);

  size = signal(0);
  private compact = signal(false);
  // En móvil caben 10 insignias en el anillo solo si son más pequeñas y se pegan más al arco.
  badgeSize = computed(() => (this.compact() ? 44 : 72));
  private arcGap = computed(() => (this.compact() ? 10 : 20));
  radius = computed(() => Math.max(0, this.size() / 2 - (this.badgeSize() * ACTIVE_SCALE) / 2 - this.arcGap()));
  arcRadius = computed(() => Math.max(0, this.size() / 2 - 4));

  count = computed(() => this.certifications().length);
  current = computed(() => this.certifications()[wrapIndex(this.active(), this.count())]);
  progress = computed(() => ((this.active() + 1) / this.count()) * 100);
  counter = computed(() => `${pad(this.active() + 1)} / ${pad(this.count())}`);

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private options = viewChildren<ElementRef<HTMLElement>>('option');

  private drag?: { last: number; moved: number };
  private suppressClick = false;
  private lastWheel = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(([entry]) => this.size.set(entry.contentRect.width));
        ro.observe(this.stage().nativeElement);
        destroyRef.onDestroy(() => ro.disconnect());
      } else {
        this.size.set(this.stage().nativeElement.clientWidth);
      }

      const mq = window.matchMedia?.('(max-width: 599px)');
      if (mq) {
        const sync = () => this.compact.set(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        destroyRef.onDestroy(() => mq.removeEventListener('change', sync));
      }
    });

    effect(onCleanup => {
      if (!this.autoplay() || this.hovered() || this.focused() || this.dragging()) return;
      const id = setInterval(() => this.next(), AUTOPLAY_MS);
      onCleanup(() => clearInterval(id));
    });
  }

  // La última rotate() anula el ángulo propio y el giro del anillo para que la insignia quede derecha.
  badgeTransform(i: number): string {
    const angle = angleFor(i, this.count());
    const scale = i === this.active() ? ACTIVE_SCALE : 0.85;
    return `rotate(${angle}deg) translate(${this.radius()}px) rotate(${-angle - this.rotation()}deg) scale(${scale})`;
  }

  select(i: number, focus = false) {
    const n = this.count();
    const index = wrapIndex(i, n);
    this.rotation.set(rotationFor(index, n, this.rotation()));
    this.active.set(index);
    if (focus) this.options()[index]?.nativeElement.focus();
  }

  next(focus = false) {
    this.select(this.active() + 1, focus);
  }

  prev(focus = false) {
    this.select(this.active() - 1, focus);
  }

  onBadgeClick(i: number) {
    if (this.suppressClick) return;
    this.select(i);
  }

  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        this.next(true);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        this.prev(true);
        break;
      case 'Home':
        this.select(0, true);
        break;
      case 'End':
        this.select(this.count() - 1, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  onWheel(event: WheelEvent) {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    event.preventDefault();
    const now = performance.now();
    if (now - this.lastWheel < WHEEL_COOLDOWN) return;
    this.lastWheel = now;
    if (delta > 0) this.next();
    else this.prev();
  }

  onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    this.drag = { last: this.angleOf(event), moved: 0 };
  }

  onPointerMove(event: PointerEvent) {
    if (!this.drag) return;
    const angle = this.angleOf(event);
    const delta = normalizeDelta(angle - this.drag.last);
    this.drag.last = angle;
    this.drag.moved += Math.abs(delta);

    if (!this.dragging()) {
      if (this.drag.moved < DRAG_THRESHOLD) return;
      // Solo capturamos al empezar a arrastrar, para no robarle el clic a las insignias.
      this.dragging.set(true);
      this.stage().nativeElement.setPointerCapture(event.pointerId);
    }
    this.rotation.update(r => r + delta);
    this.active.set(nearestIndex(this.rotation(), this.count()));
  }

  onPointerUp() {
    const wasDragging = this.dragging();
    this.drag = undefined;
    if (!wasDragging) return;
    this.dragging.set(false);
    this.select(nearestIndex(this.rotation(), this.count()));
    this.suppressClick = true;
    setTimeout(() => (this.suppressClick = false));
  }

  onFocusOut(event: FocusEvent) {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) this.focused.set(false);
  }

  private angleOf(event: PointerEvent): number {
    const rect = this.stage().nativeElement.getBoundingClientRect();
    return pointerAngle(event.clientX, event.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
