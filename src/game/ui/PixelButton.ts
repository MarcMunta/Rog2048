export interface PixelButtonOptions {
  id?: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  data?: Record<string, string | number | boolean>;
}

export function pixelButton(options: PixelButtonOptions): string {
  const data = Object.entries(options.data ?? {})
    .map(([key, value]) => `data-${key}="${String(value)}"`)
    .join(' ');
  return `<button ${options.id ? `id="${options.id}"` : ''} class="pixel-button ${options.variant ?? 'primary'}" ${data} ${
    options.disabled ? 'disabled' : ''
  }>${options.icon ? `<span class="button-icon">${options.icon}</span>` : ''}<span>${options.label}</span></button>`;
}
