import { RugoException } from '@rugo-vn/exception';
import { Schema } from '@rugo-vn/schema';
import hash from 'object-hash';

const removeRequired = (keyword, value) => {
  if (keyword === 'required') { return undefined; }

  return { [keyword]: value };
};

/**
 * Prepare args for next step:
 * - `uniques`
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
  const finalSchema = schema.toFinal();

  if (set) {
    const nonRequiredSchema = new Schema(schema.walk(removeRequired));
    args.set = nonRequiredSchema.validate(set);
  }

  if (unset) {
    for (const key in unset) {
      if (finalSchema.required && finalSchema.required.indexOf(key) !== -1) {
        const errs = [{ keyword: 'required', params: { missingProperty: key } }];
        throw errs;
      }
    }
  }
};
