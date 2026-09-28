import { Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild, viewChildren } from '@angular/core';

export interface SpotlightItem {
  image: string;
  title: string;
  meta: string;
  link?: string;
  linkLabel?: string;
}

interface Sizes {
  frame: number;       // ancho de un marco cerrado
  open: number;        // ancho máximo del marco abierto
  overlap: number;     // cuánto se solapa cada marco con el anterior
  imageHeight: number; // altura fija de la foto
}

const DESKTOP: Sizes = { frame: 64, open: 300, overlap: 24, imageHeight: 230 };
const MOBILE: Sizes = { frame: 40, open: 220, overlap: 22, imageHeight: 170 };
const PAD = 6;

@Component({
  selector: 'app-spotlight-carousel',
  templateUrl: './spotlight-carousel.html',
  styleUrl: './spotlight-carousel.scss',
  host: {
    '[style.--overlap]': "sizes().overlap + 'px'",
    '[style.--pad]': "pad + 'px'"
  }
})
export class SpotlightCarousel {
  items = input.required<SpotlightItem[]>();
  label = input('Galería');

  readonly pad = PAD;
  active = signal(0);

  private mobile = signal(false);
  sizes = computed(() => (this.mobile() ? MOBILE : DESKTOP));

  // Proporción real de cada imagen, para no abrir el marco más de lo que da la foto.
  private ratios = signal<Record<number, number>>({});

  private rail = viewChild.required<ElementRef<HTMLElement>>('rail');
  private photos = viewChildren<ElementRef<HTMLButtonElement>>('photo');

  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor() {
    const mq = window.matchMedia('(max-width: 519px)');
    const sync = () => {
      this.mobile.set(mq.matches);
      requestAnimationFrame(() => this.center(this.active()));
    };
    this.mobile.set(mq.matches);
    mq.addEventListener('change', sync);
    inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', sync));
  }

  // Ancho abierto: nunca mayor que la foto a su altura fija, para que no se amplíe.
  openWidth(i: number): number {
    const s = this.sizes();
    const ratio = this.ratios()[i];
    return ratio ? Math.min(s.open, Math.floor(ratio * s.imageHeight) + 2 * PAD) : s.open;
  }

  widthOf(i: number): number {
    return i === this.active() ? this.openWidth(i) : this.sizes().frame;
  }

  zIndexOf(i: number): number {
    return this.items().length - Math.abs(i - this.active());
  }

  onLoad(event: Event, i: number) {
    const img = event.target as HTMLImageElement;
    if (img.naturalHeight) {
      this.ratios.update(r => ({ ...r, [i]: img.naturalWidth / img.naturalHeight }));
    }
  }

  select(i: number, focus = false) {
    const last = this.items().length - 1;
    const next = Math.max(0, Math.min(last, i));
    this.active.set(next);
    this.center(next);
    if (focus) this.photos()[next]?.nativeElement.focus({ preventScroll: true });
  }

  onKeydown(event: KeyboardEvent, i: number) {
    const target = {
      ArrowRight: i + 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: this.items().length - 1
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.select(target, true);
  }

  // Calcula la posición final (no la de mitad de animación) para centrar el activo
  // cuando el raíl no cabe, como en móvil.
  private center(i: number) {
    const rail = this.rail().nativeElement;
    const track = rail.firstElementChild as HTMLElement;
    const s = this.sizes();
    const left = track.offsetLeft + i * (s.frame - s.overlap) + this.openWidth(i) / 2 - rail.clientWidth / 2;
    rail.scrollTo({ left, behavior: this.reducedMotion.matches ? 'auto' : 'smooth' });
  }
}
