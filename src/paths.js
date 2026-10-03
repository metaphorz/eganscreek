// Public files are relative to the deployment directory, including GitHub Pages.
export const publicURL = path => import.meta.env.BASE_URL + path.replace(/^\/+/, '');
