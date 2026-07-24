import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Nav } from './components/nav/nav';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [Nav, Hero, About, Skills, Projects, Contact, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  // Observa todos los .anim del documento (de cualquier sección) y los revela
  // al entrar en viewport. Corre tras renderizarse los componentes hijos.
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
}
