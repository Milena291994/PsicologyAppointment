let idCounter = 0;

/** Id único en la sesión del navegador; lo reemplazará el que asigne el backend. */
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
