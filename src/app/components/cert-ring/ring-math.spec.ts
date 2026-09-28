import { TOP, angleFor, nearestIndex, normalizeDelta, pointerAngle, rotationFor, wrapIndex } from './ring-math';

describe('ring-math', () => {
  it('reparte las insignias uniformemente', () => {
    expect(angleFor(0, 6)).toBe(0);
    expect(angleFor(1, 6)).toBe(60);
    expect(angleFor(5, 6)).toBe(300);
    expect(angleFor(3, 8)).toBe(135);
  });

  it('normaliza diferencias de ángulo a (-180, 180]', () => {
    expect(normalizeDelta(0)).toBe(0);
    expect(normalizeDelta(90)).toBe(90);
    expect(normalizeDelta(270)).toBe(-90);
    expect(normalizeDelta(-270)).toBe(90);
    expect(normalizeDelta(540)).toBe(180);
    expect(normalizeDelta(-180)).toBe(180);
    expect(normalizeDelta(-721)).toBe(-1);
  });

  it('envuelve índices en ambos sentidos', () => {
    expect(wrapIndex(6, 6)).toBe(0);
    expect(wrapIndex(-1, 6)).toBe(5);
    expect(wrapIndex(13, 6)).toBe(1);
  });

  it('lleva la insignia activa a las 12', () => {
    expect(rotationFor(0, 6, TOP)).toBe(TOP);
    expect(rotationFor(1, 6, TOP)).toBe(TOP - 60);
  });

  it('gira siempre por el camino más corto', () => {
    // De la última a la primera: un paso de +60°, no -300°.
    const atLast = rotationFor(5, 6, TOP);
    expect(atLast).toBe(TOP + 60);
    expect(rotationFor(0, 6, atLast)).toBe(TOP);

    // Con el anillo ya girado varias vueltas, sigue siendo un solo paso.
    const spun = TOP - 720;
    expect(rotationFor(1, 6, spun)).toBe(spun - 60);
    expect(rotationFor(5, 6, spun)).toBe(spun + 60);
  });

  it('encuentra la insignia más cercana a las 12 tras un giro libre', () => {
    expect(nearestIndex(TOP, 6)).toBe(0);
    expect(nearestIndex(TOP - 60, 6)).toBe(1);
    expect(nearestIndex(TOP - 80, 6)).toBe(1);
    expect(nearestIndex(TOP - 100, 6)).toBe(2);
    expect(nearestIndex(TOP + 25, 6)).toBe(0);
    expect(nearestIndex(TOP + 40, 6)).toBe(5);
    expect(nearestIndex(TOP - 360 * 3 - 60, 6)).toBe(1);
  });

  it('calcula el ángulo del puntero respecto al centro', () => {
    expect(pointerAngle(10, 0, 0, 0)).toBe(0);
    expect(pointerAngle(0, 10, 0, 0)).toBe(90);
    expect(pointerAngle(0, -10, 0, 0)).toBe(-90);
    expect(pointerAngle(-10, 0, 0, 0)).toBe(180);
  });
});
