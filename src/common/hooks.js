import { ajvError, RugoException } from '@rugo-vn/exception';
import { Schema } from '@rugo-vn/schema';
import hash from 'object-hash';
import ObjectPath from 'object-path';

export const removeRequired = (keyword, value) => {
  if (keyword === 'required') { return undefined; }

  return { [keyword]: value };
};

const mapToObject = (m) => {
  const o = {};
  for (const key in m) {
    ObjectPath.set(o, key, m[key]);
  }
  return o;
};

const objectToMap = (o) => {
  if (!o || typeof o !== 'object') { return { '': o }; }

  const result = {};
  for (const key in o) {
    const value = o[key];
    const nextObj = objectToMap(value);
    for (const nextKey in nextObj) {
      result[`${key}${nextKey ? '.' + nextKey : ''}`] = nextObj[nextKey];
    }
  }
  return result;
};

const checkRequired = unset => (keyword, value, traces) => {
  if (keyword !== 'required') { return { [keyword]: value }; }

  const ls = [];
  for (const v of value) {
    const nextTraces = [...traces, 'properties', v];
    let p = '';
    let i = 1;
    while (i < nextTraces.length) {
      if (nextTraces[i - 1] === 'items') {
        p += '.$';
        i++;
        continue;
      }

      p += '.' + nextTraces[i];
      i += 2;
    }

    ls.push(p.substring(1));
  }

  for (let key in unset) {
    key = key.replace(/\d+/g, '\$'); // eslint-disable-line
    if (ls.indexOf(key) !== -1) {
      throw ajvError({ keyword: 'required', params: { missingProperty: key } });
    }
  }

  return { [keyword]: value };
};

/**
 * Prepare args for next step:
 * - `uniques`
 * - `searches`
 * - `schema`
 * - `register`
 *
 * @param fn
 * @param args
 */
export const commonAllHook = async function (fn, args) {
  const { name } = args;
  if (!name) { throw new RugoException('Driver action must have name as required argument.'); }

  const schema = this.globals[`schema.${name}`];

  if (!schema) { throw new RugoException('Driver action can not find the schema'); }

  const hashed = hash(schema);
  const uniques = schema.uniques || [];

  args.uniques = uniques;
  args.searches = schema.searches || [];
  args.schema = schema;

  const register = this.registers[name] || {};
  if (register.hashed !== hashed) {
    register.name = name;
    register.hashed = hashed;
    register.value = await fn.bind(this)(args);
    this.registers[name] = register;
  }
  args.register = register;
};

/**
 * Validate data
 *
 * @param args
 */
export const commonCreateHook = async function (args) {
  const { data, schema: raw } = args;

  const schema = new Schema(raw);
  args.data = schema.validate(data);
};

/**
 * Validate data, re-compose:
 * - `set`
 * - `unset`
 * - `inc`
 *
 * @param args
 */
export const commonUpdateHook = async function (args) {
  const { set, unset, schema: raw } = args;

  const schema = new Schema(raw);

  if (set) {
    const nonRequiredSchema = new Schema(schema.walk(removeRequired));
    const setObj = nonRequiredSchema.validate(mapToObject(set), false);
    args.set = objectToMap(setObj);
  }

  if (unset) {
    schema.walk(checkRequired(unset));
  }
};
