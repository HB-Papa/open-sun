/** Where a visitor's theme choice is saved in their browser. */
export const THEME_KEY = 'opensun:theme';

/**
 * Runs in <head> before the page paints, so a saved choice never flashes the other theme.
 * With nothing saved, <html> has no data-theme and the CSS follows the device setting.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
