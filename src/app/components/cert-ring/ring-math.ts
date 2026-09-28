// Geometría del anillo. Los ángulos van en grados y en el sentido de CSS:
// 0° apunta a las 3 en punto y crecen en sentido horario.

/** Ángulo de las 12 en punto. */
export const TOP = -90;

/** Posición angular de la insignia i dentro del anillo (sin girar). */
export function angleFor(i: number, n: number): number {
  return (360 / n) * i;
}

/** Lleva una diferencia de ángulo al rango (-180, 180] para girar por el camino más corto. */
export function normalizeDelta(delta: number): number {
  const d = ((((delta + 180) % 360) + 360) % 360) - 180;
  return d === -180 ? 180 : d;
}

export function wrapIndex(i: number, n: number): number {
  return ((i % n) + n) % n;
}

/** Rotación del anillo que deja la insignia i arriba, partiendo de la actual por el camino más corto. */
export function rotationFor(i: number, n: number, current: number): number {
  const target = TOP - angleFor(i, n);
  return current + normalizeDelta(target - current);
}

/** Insignia que queda más cerca de las 12 con el anillo girado `rotation` grados. */
export function nearestIndex(rotation: number, n: number): number {
  return wrapIndex(Math.round((TOP - rotation) / (360 / n)), n);
}

/** Ángulo del puntero respecto al centro del anillo. */
export function pointerAngle(x: number, y: number, cx: number, cy: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}
