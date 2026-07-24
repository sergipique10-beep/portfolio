import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  /** Desplaza suavemente hasta la sección con el id dado. */
  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
