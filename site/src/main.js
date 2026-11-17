import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import './style.css';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches && !params.has('film');

// The film needs WebGL and motion; without either, the page stays the still sequence it already is.
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (_) { return false; }
}

if (!reduced && !params.has('stills') && webglAvailable()) {
  document.documentElement.classList.add('film');
  import('./film.js')
    .then((m) => m.startFilm(params))
    .catch((e) => {
      console.error(e);
      document.documentElement.classList.remove('film');
    });
}
