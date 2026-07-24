import { Component, signal, HostListener, inject } from '@angular/core';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.html',
  styleUrl: './nav.scss'
})
export class Nav {
  private scroll = inject(ScrollService);

  menuOpen = signal(false);
  navScrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.navScrolled.set(window.scrollY > 60);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  navTo(id: string) {
    this.scroll.scrollTo(id);
    this.menuOpen.set(false);
  }
}
