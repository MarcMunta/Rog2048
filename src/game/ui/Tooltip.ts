import { escapeHtml } from '../utils/dom';

export function tooltip(text: string): string {
  return `data-tooltip="${escapeHtml(text)}"`;
}
