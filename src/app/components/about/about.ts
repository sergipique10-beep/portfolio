import { Component } from '@angular/core';

interface Trait {
  label: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  traits: Trait[] = [
    {
      label: 'Metódico',
      desc: 'Proceso claro en cada entrega, de la especificación al despliegue.',
      icon: 'M9 6l2 2 4-4M9 14l2 2 4-4M5 20h14'
    },
    {
      label: 'Organizado',
      desc: 'Código y arquitectura estructurados para escalar sin fricción.',
      icon: 'grid'
    },
    {
      label: 'Proactivo',
      desc: 'Propongo mejoras y adopto herramientas nuevas antes de que se pidan.',
      icon: 'M3 17l6-6 4 4 8-8M15 7h6v6'
    }
  ];
}
