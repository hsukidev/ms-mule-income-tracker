const isDotfilePath = (file) =>
  file.split('/').some((segment) => segment.startsWith('.') && segment.length > 1);

export default {
  '*.{ts,tsx,js,jsx,cjs,mjs}': (files) => {
    const lintable = files.filter((file) => !isDotfilePath(file));
    if (lintable.length === 0) return [];
    const args = lintable.map((file) => JSON.stringify(file)).join(' ');
    return [`eslint --max-warnings=0 --fix ${args}`];
  },
  '*.{json,md,css,html,yml,yaml}': 'prettier --write',
};
