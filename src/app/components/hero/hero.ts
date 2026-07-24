import { Component, inject } from '@angular/core';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  private scroll = inject(ScrollService);

  scrollTo(id: string) {
    this.scroll.scrollTo(id);
  }
}
