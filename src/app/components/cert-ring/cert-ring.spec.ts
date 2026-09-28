import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CertRing } from './cert-ring';
import { SAMPLE_CERTIFICATIONS } from './cert-ring.data';
import { TOP } from './ring-math';

describe('CertRing', () => {
  let fixture: ComponentFixture<CertRing>;
  let ring: CertRing;

  const options = () => Array.from(fixture.nativeElement.querySelectorAll('[role="option"]')) as HTMLElement[];
  const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertRing);
    ring = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('usa los datos de ejemplo por defecto y arranca en la primera', () => {
    expect(ring.count()).toBe(SAMPLE_CERTIFICATIONS.length);
    expect(ring.active()).toBe(0);
    expect(ring.rotation()).toBe(TOP);
    expect(ring.counter()).toBe('01 / 06');
  });

  it('avanza y retrocede con envoltura', () => {
    ring.next();
    expect(ring.active()).toBe(1);
    ring.prev();
    ring.prev();
    expect(ring.active()).toBe(5);
    expect(ring.counter()).toBe('06 / 06');
    // Retroceder desde la primera es un solo paso de giro, no una vuelta entera.
    expect(ring.rotation()).toBe(TOP + 60);
  });

  it('marca la insignia activa con aria-selected y tabindex', () => {
    ring.select(2);
    fixture.detectChanges();
    const opts = options();
    expect(opts[2].getAttribute('aria-selected')).toBe('true');
    expect(opts[2].tabIndex).toBe(0);
    expect(opts[0].getAttribute('aria-selected')).toBe('false');
    expect(opts[0].tabIndex).toBe(-1);
  });

  it('navega con las flechas y mueve el foco', () => {
    key(options()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(ring.active()).toBe(1);
    expect(document.activeElement).toBe(options()[1]);

    key(options()[1], 'ArrowLeft');
    key(options()[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(ring.active()).toBe(5);

    key(options()[5], 'Home');
    expect(ring.active()).toBe(0);
    key(options()[0], 'End');
    expect(ring.active()).toBe(5);
  });

  it('activa una insignia al hacer clic', () => {
    options()[3].click();
    expect(ring.active()).toBe(3);
  });

  it('avanza una posición con la rueda y respeta el enfriamiento', () => {
    const stage = fixture.nativeElement.querySelector('.stage') as HTMLElement;
    stage.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
    stage.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
    expect(ring.active()).toBe(1);
  });

  it('muestra la certificación activa en el panel', () => {
    ring.select(4);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.panel') as HTMLElement;
    expect(panel.textContent).toContain(SAMPLE_CERTIFICATIONS[4].title);
    expect(panel.querySelector('a')?.getAttribute('href')).toBe(SAMPLE_CERTIFICATIONS[4].credentialUrl);
  });

  it('avanza solo con autoplay y se pausa al pasar el ratón', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('autoplay', true);
    fixture.detectChanges();
    TestBed.tick();

    vi.advanceTimersByTime(4000);
    expect(ring.active()).toBe(1);

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    TestBed.tick();
    vi.advanceTimersByTime(8000);
    expect(ring.active()).toBe(1);
    vi.useRealTimers();
  });
});
