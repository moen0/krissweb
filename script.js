const html = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const lightLabel = toggle.querySelector('.light-label');
const darkLabel = toggle.querySelector('.dark-label');

const saved = localStorage.getItem('theme');
if (saved) {
  html.dataset.theme = saved;
  updateLabels();
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  html.dataset.theme = 'dark';
  updateLabels();
}

toggle.addEventListener('click', () => {
  const next = html.dataset.theme === 'light' ? 'dark' : 'light';
  html.dataset.theme = next;
  localStorage.setItem('theme', next);
  updateLabels();
});

function updateLabels() {
  const isDark = html.dataset.theme === 'dark';
  lightLabel.style.display = isDark ? 'none' : 'inline';
  darkLabel.style.display = isDark ? 'inline' : 'none';
}
