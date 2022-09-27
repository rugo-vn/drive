import { customAlphabet } from 'nanoid';

const MAX_TIME = 99999999999999;
export const ID_TIME_SIZE = MAX_TIME.toString(36).length;
export const ID_PREFIX = 'r';
export const ID_SIZE = 128 / 8;
export const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
export const DIRECTORY_MIME = 'inode/directory';

const nanoid = customAlphabet(ID_ALPHABET, ID_SIZE - ID_TIME_SIZE - ID_PREFIX.length);

/**
 * Add prefix to origin text.
 *
 * @param {string} origin Origin string. Required.
 * @param {number} max Max length of needed string. Required.
 * @param {string} character Character to add. Required.
 * @returns {string} Transformed String.
 */
const align = (origin, max, character) => {
  origin = origin.substring(Math.max(origin.length - max, 0));
  while (origin.length < max) { origin = character + origin; }
  return origin;
};

/**
 * Get unique now time.
 *
 * @returns {number} Now in milisecond.
 */
const now = () => {
  const time = Date.now();
  const last = now.last || time;
  now.last = time > last ? time : last + 1;
  return now.last;
};

/**
 * Generate unique id.
 *
 * @returns {string} Id generated
 */
export const generateId = () => {
  return ID_PREFIX + align(now().toString(36), ID_TIME_SIZE, '0') + nanoid();
};
