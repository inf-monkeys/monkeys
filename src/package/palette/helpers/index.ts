export function hexToRGB(H: string): { r: number; g: number; b: number } {
  if (H.length === 6 && !H.startsWith('#')) {
    H = `#${H}`;
  }

  let r = 0;
  let g = 0;
  let b = 0;
  if (H.length === 4) {
    r = parseInt(`0x${H[1]}${H[1]}`, 16);
    g = parseInt(`0x${H[2]}${H[2]}`, 16);
    b = parseInt(`0x${H[3]}${H[3]}`, 16);
  } else if (H.length === 7) {
    r = parseInt(`0x${H[1]}${H[2]}`, 16);
    g = parseInt(`0x${H[3]}${H[4]}`, 16);
    b = parseInt(`0x${H[5]}${H[6]}`, 16);
  }

  return { r, g, b };
}

export function hexToHSL(H: string): { h: number; s: number; l: number } {
  if (H.length === 6 && !H.startsWith(`#`)) {
    H = `#${H}`;
  }

  // Convert hex to RGB first
  let { r, g, b } = hexToRGB(H);
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}

export function round(value: number, precision: number = 0): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

export function luminanceFromRGB(r: number, g: number, b: number): number {
  // Formula from WCAG 2.0
  const [R, G, B] = [r, g, b].map(function (c) {
    c /= 255; // to 0-1 range
    return c < 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 21.26 * R + 71.52 * G + 7.22 * B;
}

export function luminanceFromHex(H: string): number {
  const { r, g, b } = hexToRGB(H);
  return round(luminanceFromRGB(r, g, b), 2);
}

export function unsignedModulo(x: number, n: number) {
  return ((x % n) + n) % n;
}

export function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

export function HSLtoRGB(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function lightnessFromHSLum(H: number, S: number, Lum: number): number {
  const values: { [L: number]: number } = {};
  for (let L = 99; L >= 0; L--) {
    const { r, g, b } = HSLtoRGB(H, S, L);
    values[L] = Math.abs(Lum - luminanceFromRGB(r, g, b));
  }

  // Run through all these and find the closest to 0
  let lowestDiff = 100;
  let newL = 100;
  for (let i = Object.keys(values).length - 1; i >= 0; i--) {
    if (values[i] < lowestDiff) {
      newL = i;
      lowestDiff = values[i];
    }
  }

  return newL;
}

export function HSLToHex(h: number, s: number, l: number): string {
  const { r, g, b } = HSLtoRGB(h, s, l);

  // Having obtained RGB, convert channels to hex
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export function isHex(value: string) {
  const valueHex = value.length === 6 && !value.startsWith(`#`) ? `#${value}` : value;

  const re = new RegExp(/^#[0-9A-F]{6}$/i);

  return re.test(valueHex.toUpperCase());
}
