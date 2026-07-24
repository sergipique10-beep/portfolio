import { Component, inject, signal, HostListener } from '@angular/core';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  private scroll = inject(ScrollService);

  // El orbe de Spline es pesado (WebGL): en móvil no lo renderizamos, así no se
  // descarga ni su runtime ni la escena. Solo se monta cuando el grid es de 2 col.
  showVisual = signal(this.isWide());

  private isWide(): boolean {
    return typeof window !== 'undefined' && window.innerWidth > 860;
  }

  @HostListener('window:resize')
  onResize() {
    this.showVisual.set(this.isWide());
  }

  scrollTo(id: string) {
    this.scroll.scrollTo(id);
  }
}
