import { v4 as uuidv4 } from 'uuid';

export function nanoid(prefix = 'n') {
  return `${prefix}_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}

export function createId(prefix = 'node') {
  return nanoid(prefix);
}

export default nanoid;
