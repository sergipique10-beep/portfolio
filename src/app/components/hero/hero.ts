import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero implements AfterViewInit, OnDestroy {
  private scroll = inject(ScrollService);

  @ViewChild('video', { static: true }) private videoRef!: ElementRef<HTMLVideoElement>;

  // Con "reduce motion" el vídeo se queda pausado en su primer fotograma (el poster).
  private reducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : undefined;
  // Fuera de pantalla no tiene sentido seguir decodificando fotogramas.
  private visible = true;
  private observer?: IntersectionObserver;

  private syncMotion = () => {
    const video = this.videoRef.nativeElement;
    if (this.reducedMotion?.matches || !this.visible) {
      video.pause();
    } else {
      video.play()?.catch(() => {});
    }
  };

  ngAfterViewInit() {
    // Angular no siempre refleja el atributo "muted" como propiedad, y sin él
    // los navegadores bloquean el autoplay.
    this.videoRef.nativeElement.muted = true;
    this.syncMotion();
    this.reducedMotion?.addEventListener('change', this.syncMotion);

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncMotion();
      });
      this.observer.observe(this.videoRef.nativeElement);
    }
  }

  ngOnDestroy() {
    this.reducedMotion?.removeEventListener('change', this.syncMotion);
    this.observer?.disconnect();
  }

  scrollTo(id: string) {
    this.scroll.scrollTo(id);
  }
}
