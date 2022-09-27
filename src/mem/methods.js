export const validateProperty = function (schema, key, value) {
  const validate = this.ajv.compile({
    type: 'object',
    properties: {
      [key]: schema.properties[key]
    }
  });

  if (!validate({ [key]: value })) {
    return validate.errors.map(raw => {
      raw.value = value;
      return raw;
    });
  }

  return [];
};
