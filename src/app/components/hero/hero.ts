import { Component, inject, signal, HostListener } from '@angular/core';
import { ScrollService } from '../../scroll.service';
import { HeroWave } from '../hero-wave/hero-wave';

@Component({
  selector: 'app-hero',
  imports: [HeroWave],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  private scroll = inject(ScrollService);

  // El océano (Three.js) es pesado (WebGL): en móvil no lo renderizamos, así no
  // se descarga ni su runtime ni la escena. Solo se monta en escritorio.
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
