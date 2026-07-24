import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class About {
  traits = ['Metódico', 'Organizado', 'Proactivo'];
}
