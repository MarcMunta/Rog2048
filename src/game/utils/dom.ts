export function uiRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('#ui-root');
  if (!root) throw new Error('Missing #ui-root');
  return root;
}

export function toastRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('#toast-root');
  if (!root) throw new Error('Missing #toast-root');
  return root;
}

export function setUi(html: string): HTMLElement {
  const root = uiRoot();
  root.innerHTML = html;
  return root;
}

export function clearUi(): void {
  uiRoot().innerHTML = '';
}

export function bindClick(root: ParentNode, selector: string, handler: (el: HTMLElement) => void): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.addEventListener('click', () => handler(element));
  });
}

export function showToast(message: string, tone: 'good' | 'bad' | 'neutral' = 'neutral'): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  toastRoot().appendChild(toast);
  window.setTimeout(() => toast.remove(), 2400);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return map[char];
  });
}
