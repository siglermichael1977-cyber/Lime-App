type Listener = () => void;
const listeners = new Set<Listener>();

export function onPostCreated(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyPostCreated() {
  listeners.forEach(listener => listener());
}
