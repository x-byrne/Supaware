export { rebase } from './rebase.js';
export { growth } from './growth.js';
export { ratio } from './ratio.js';

export function compose(transforms, data) {
  if (!Array.isArray(transforms)) return data;
  return transforms.reduce((acc, fn) => fn(acc), data);
}
