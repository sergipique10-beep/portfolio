import { Component, ElementRef, HostBinding, HostListener, OnDestroy, AfterViewInit, ViewChild, signal } from '@angular/core';

const SESSION_KEY = 'intro-played';
const CELL = 22;
const FRAME_INTERVAL = 1000 / 30;

// Editable: texto de las 3 líneas de terminal de la intro.
const TERMINAL_LINES = [
  '> estableciendo conexión...',
  '> descifrando identidad...',
  '> acceso concedido_',
];

const GLYPHS = '01アイウエオカキクケコサシスセソタチツテト#$%*+-'.split('');

@Component({
  selector: 'app-intro',
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class Intro implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly shouldPlay = this.computeShouldPlay();

  readonly active = signal(this.shouldPlay);
  readonly avatarVisible = signal(false);
  readonly fadingOut = signal(false);
  readonly terminalText = signal('');

  @HostBinding('class.intro-hidden')
  get hidden() {
    return !this.active();
  }

  private ctx?: CanvasRenderingContext2D;
  private rafId = 0;
  private dim = 0;
  private dimTarget = 0;
  private drops: number[] = [];
  private cols = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];

  private computeShouldPlay(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  }

  ngAfterViewInit() {
    if (!this.shouldPlay) return;

    const reduceMotion = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.finish(true);
      return;
    }

    document.body.style.overflow = 'hidden';
    this.setupCanvas();
    this.draw();
    this.timers.push(setTimeout(() => this.typeSequence(0, 0, ''), 700));
  }

  @HostListener('click')
  @HostListener('window:keydown')
  skip() {
    if (this.active() && !this.fadingOut()) this.finish(true);
  }

  private setupCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d') ?? undefined;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private resize = () => {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.cols = Math.floor(canvas.width / CELL);
    this.drops = Array.from({ length: this.cols }, () => Math.random() * -50);
  };

  private lastFrameTime = 0;

  private draw = (time = 0) => {
    this.rafId = requestAnimationFrame(this.draw);

    if (time - this.lastFrameTime < FRAME_INTERVAL) return;
    this.lastFrameTime = time;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;
    const ctx = this.ctx;

    ctx.fillStyle = `rgba(4, 10, 20, ${0.08 + this.dim * 0.12})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${CELL}px monospace`;

    for (let i = 0; i < this.cols; i++) {
      const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const x = i * CELL;
      const y = this.drops[i] * CELL;

      ctx.fillStyle = `rgba(205, 228, 255, ${0.85 - this.dim * 0.7})`;
      ctx.fillText(glyph, x, y);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.55 - this.dim * 0.5})`;
      ctx.fillText(glyph, x, y - CELL);

      if (y > canvas.height && Math.random() > 0.975) this.drops[i] = 0;
      this.drops[i]++;
    }

    if (this.dimTarget > this.dim) this.dim = Math.min(this.dimTarget, this.dim + 0.05);
  };

  private typeSequence(lineIndex: number, charIndex: number, out: string) {
    if (lineIndex >= TERMINAL_LINES.length) {
      this.timers.push(setTimeout(() => this.showAvatar(), 500));
      return;
    }
    const line = TERMINAL_LINES[lineIndex];
    if (charIndex <= line.length) {
      this.terminalText.set(out + line.slice(0, charIndex));
      this.timers.push(setTimeout(() => this.typeSequence(lineIndex, charIndex + 1, out), 45));
    } else {
      this.timers.push(setTimeout(() => this.typeSequence(lineIndex + 1, 0, out + line + '\n'), 350));
    }
  }

  // El avatar se materializa (glitch + glow) mientras la lluvia se atenúa,
  // se mantiene visible un instante y luego damos paso al fundido final.
  private showAvatar() {
    this.avatarVisible.set(true);
    this.dimTarget = 1;
    this.timers.push(setTimeout(() => this.finish(), 1700));
  }

  private finish(skipFade = false) {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.fadingOut.set(true);
    this.dimTarget = 1;
    document.body.style.overflow = '';
    sessionStorage.setItem(SESSION_KEY, '1');

    const fadeMs = skipFade ? 0 : 900;
    this.timers.push(setTimeout(() => {
      cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', this.resize);
      this.active.set(false);
    }, fadeMs));
  }

  ngOnDestroy() {
    this.timers.forEach(clearTimeout);
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
    document.body.style.overflow = '';
  }
}
