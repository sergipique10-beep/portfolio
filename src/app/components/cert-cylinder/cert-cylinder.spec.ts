import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CertCylinder, faceFor, radiusFor, shortestDelta } from './cert-cylinder';
import { SAMPLE_CYLINDER_CERTS } from './cert-cylinder.data';

describe('geometría del cilindro', () => {
  it('calcula el radio para que las tarjetas queden pegadas', () => {
    const n = 14;
    const r = radiusFor(n, 168, 16);
    // La cuerda entre dos tarjetas vecinas es exactamente ancho + gap.
    expect(2 * r * Math.tan(Math.PI / n)).toBeCloseTo(184, 6);
    expect(radiusFor(4, 100, 0)).toBeCloseTo(50, 6);
  });

  it('face es 1 delante, 0 de lado y -1 detrás', () => {
    expect(faceFor(0, 4, 0)).toBeCloseTo(1);
    expect(faceFor(1, 4, 0)).toBeCloseTo(0);
    expect(faceFor(2, 4, 0)).toBeCloseTo(-1);
    // Girando el anillo -90° la tarjeta 1 pasa al frente.
    expect(faceFor(1, 4, -90)).toBeCloseTo(1);
  });

  it('elige el camino más corto', () => {
    expect(shortestDelta(350)).toBe(-10);
    expect(shortestDelta(-350)).toBe(10);
    expect(shortestDelta(90)).toBe(90);
    expect(shortestDelta(720 + 30)).toBe(30);
  });
});

describe('CertCylinder', () => {
  let fixture: ComponentFixture<CertCylinder>;
  let cyl: CertCylinder;

  beforeEach(async () => {
    fixture = TestBed.createComponent(CertCylinder);
    cyl = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('usa los 14 ejemplos por defecto, con la primera al frente', () => {
    expect(cyl.count()).toBe(14);
    expect(SAMPLE_CYLINDER_CERTS.every(c => c.title.startsWith('[EJEMPLO]'))).toBe(true);
    expect(cyl.front()).toBe(0);
  });

  it('las flechas llevan a la posición exacta siguiente y anterior', () => {
    const stage = fixture.nativeElement.querySelector('.stage') as HTMLElement;
    // Sin requestAnimationFrame real, forzamos el snap sin animación.
    (cyl as unknown as { reducedMotion: { set(v: boolean): void } }).reducedMotion.set(true);

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(cyl.angle).toBeCloseTo(-360 / 14);
    expect(cyl.front()).toBe(1);

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(cyl.angle).toBeCloseTo(360 / 14);
    expect(cyl.front()).toBe(13);
  });

  it('lleva una tarjeta al frente por el camino más corto', () => {
    (cyl as unknown as { reducedMotion: { set(v: boolean): void } }).reducedMotion.set(true);
    cyl.bringToFront(12);
    expect(cyl.angle).toBeCloseTo((360 / 14) * 2); // dos pasos hacia atrás, no doce hacia delante
    expect(cyl.front()).toBe(12);
  });

  it('pausar detiene el autogiro y muestra "Reanudar"', () => {
    expect(cyl.autoRotating()).toBe(true);
    cyl.togglePause();
    fixture.detectChanges();
    expect(cyl.autoRotating()).toBe(false);
    const btn = fixture.nativeElement.querySelector('[aria-pressed]') as HTMLElement;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.textContent).toContain('Reanudar');
  });
});
