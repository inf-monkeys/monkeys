import { debounce } from 'lodash';

export const setNeocardTheme = debounce((colors: { light: string; dark: string } | string) => {
  let lightColor: string;
  let darkColor: string;

  if (typeof colors === 'string') {
    // Backward compatibility - if string is passed, use it for both
    lightColor = colors;
    darkColor = colors;
  } else {
    lightColor = colors.light;
    darkColor = colors.dark;
  }

  const styles = `
    :root {
      --neocard: ${lightColor};
    }
    .dark {
      --neocard: ${darkColor};
    }
  `;

  const themeDOM = document.getElementById('vines-neocard-theme');
  if (!themeDOM) {
    const newThemeDOM = document.createElement('style');
    newThemeDOM.id = 'vines-neocard-theme';
    document.head.appendChild(newThemeDOM);
    newThemeDOM.innerHTML = styles;
  } else {
    themeDOM.innerHTML = styles;
  }
}, 64);
