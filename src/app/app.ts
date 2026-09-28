import { Component, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Intro } from './components/intro/intro';
import { Nav } from './components/nav/nav';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Certifications } from './components/certifications/certifications';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { Babysharky } from './components/babysharky/babysharky';
import { ChatDrawer } from './components/chat-drawer/chat-drawer';

@Component({
  selector: 'app-root',
  imports: [Intro, Nav, Hero, About, Skills, Projects, Certifications, Contact, Footer, Babysharky, ChatDrawer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild(ChatDrawer) chatDrawer?: ChatDrawer;

  private observer?: IntersectionObserver;
  private mutations?: MutationObserver;
  chatDrawerOpen = false;

  // Observa todos los .anim del documento (de cualquier sección) y los revela
  // al entrar en viewport. Corre tras renderizarse los componentes hijos.
  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    this.observer = observer;
    document.querySelectorAll('.anim').forEach(el => observer.observe(el));

    // Los .anim que aparecen más tarde (p. ej. la escena de Spline, que solo se
    // monta al ensanchar la ventana) también hay que observarlos, o se quedan
    // con opacity: 0 para siempre.
    this.mutations = new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(node => {
      if (!(node instanceof Element)) return;
      if (node.matches('.anim')) observer.observe(node);
      node.querySelectorAll('.anim').forEach(el => observer.observe(el));
    })));
    this.mutations.observe(document.body, { childList: true, subtree: true });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.mutations?.disconnect();
  }

  toggleChat() {
    this.chatDrawerOpen = !this.chatDrawerOpen;
  }

  onChatClose() {
    this.chatDrawerOpen = false;
  }
}
