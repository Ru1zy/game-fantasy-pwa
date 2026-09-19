const themeList = ['prairie', 'desert', 'arctic', 'mountain'];

const themes = new Proxy(
  {
    1: 'prairie',
    2: 'desert',
    3: 'arctic',
    4: 'mountain',
  },
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      const num = parseInt(prop, 10);
      if (!Number.isNaN(num) && num > 0) {
        return themeList[(num - 1) % themeList.length];
      }
      return target[prop];
    },
  },
);

export function getThemeByLevel(level) {
  return themeList[(Math.max(1, level) - 1) % themeList.length];
}

export default themes;
