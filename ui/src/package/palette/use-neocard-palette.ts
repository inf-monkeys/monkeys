import { debounce } from 'lodash';

export const setNeocardTheme = debounce((color: string) => {
  const styles = `
    :root {
      --neocard: ${color};
    }
    .dark {
      --neocard: ${color};
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
