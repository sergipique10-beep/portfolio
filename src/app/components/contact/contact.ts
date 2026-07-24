import { Component, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {
  // La escena de Spline es pesada (WebGL): en móvil no se renderiza para no
  // descargar el runtime ni la escena. Solo se monta cuando el grid es de 2 col.
  showVisual = signal(this.isWide());

  private isWide(): boolean {
    return typeof window !== 'undefined' && window.innerWidth > 820;
  }

  @HostListener('window:resize')
  onResize() {
    this.showVisual.set(this.isWide());
  }
}
