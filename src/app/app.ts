import { Component, signal, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

interface Project {
  name: string;
  description: string;
  tags: string[];
  url: string;
}

interface SkillGroup {
  label: string;
  items: string[];
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnDestroy {
  menuOpen = signal(false);
  navScrolled = signal(false);

  private observer?: IntersectionObserver;

  projects: Project[] = [
    {
      name: 'Mercedes',
      description: 'Plataforma web para gestión de concesionarios y catálogo de vehículos con interfaz moderna y filtros avanzados.',
      tags: ['Angular', 'TypeScript', 'SCSS'],
      url: 'https://github.com/sergipique10-beep/ProyectoMercedesSP'
    },
    {
      name: 'LOTR',
      description: 'Fan site interactivo de El Señor de los Anillos con catálogo de personajes, lugares y lore del universo de Tolkien.',
      tags: ['Angular', 'API REST', 'CSS'],
      url: 'https://github.com/sergipique10-beep/Angular-LOTR'
    },
    {
      name: 'Tulapp',
      description: 'Aplicación de gestión de tareas y productividad personal con seguimiento de objetivos y estadísticas.',
      tags: ['Angular', 'TypeScript', 'Firebase'],
      url: 'https://github.com/sergipique10-beep/Tulapp2.0'
    },
    {
      name: 'CsFinance',
      description: 'Dashboard de análisis financiero con visualización de datos, gestión de carteras y seguimiento de mercados.',
      tags: ['React', 'Charts.js', 'API REST'],
      url: 'https://github.com/sergipique10-beep/LoginCsFinance'
    }
  ];

  skillGroups: SkillGroup[] = [
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'HTML5', 'SCSS / CSS3', 'RxJS']
    },
    {
      label: 'Backend & Herramientas',
      items: ['Node.js', 'REST APIs', 'SQL', 'Git / GitHub', 'Figma', 'VS Code']
    }
  ];

  traits = ['Metódico', 'Organizado', 'Proactivo'];

  @HostListener('window:scroll')
  onScroll() {
    this.navScrolled.set(window.scrollY > 60);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.anim').forEach(el => this.observer!.observe(el));
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen.set(false);
  }
}
