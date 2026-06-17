'use strict';

/**
 * VSL - Validation Schema Language
 * Field-level validator DSL. Returns formatted HTTP 400 error responses on failure.
 */

class FieldValidator {
  constructor(fieldName) {
    this._field = fieldName;
    this._rules = [];
    this._isRequired = false;
    this._type = null;
  }

  required() {
    this._isRequired = true;
    return this;
  }

  string() {
    this._type = 'string';
    return this;
  }

  number() {
    this._type = 'number';
    return this;
  }

  array() {
    this._type = 'array';
    return this;
  }

  object() {
    this._type = 'object';
    return this;
  }

  min(length) {
    this._rules.push((val) => {
      if (typeof val === 'string' && val.length < length) {
        return `${this._field} must be at least ${length} characters`;
      }
      if (typeof val === 'number' && val < length) {
        return `${this._field} must be at least ${length}`;
      }
      return null;
    });
    return this;
  }

  max(length) {
    this._rules.push((val) => {
      if (typeof val === 'string' && val.length > length) {
        return `${this._field} must be at most ${length} characters`;
      }
      return null;
    });
    return this;
  }

  exact(length) {
    this._rules.push((val) => {
      if (typeof val === 'string' && val.length !== length) {
        return `${this._field} must be exactly ${length} characters`;
      }
      return null;
    });
    return this;
  }

  enum(values) {
    this._rules.push((val) => {
      if (!values.includes(val)) {
        return `${this._field} must be one of: ${values.join(', ')}`;
      }
      return null;
    });
    return this;
  }

  pattern(regex, message) {
    this._rules.push((val) => {
      if (typeof val === 'string' && !regex.test(val)) {
        return message || `${this._field} has an invalid format`;
      }
      return null;
    });
    return this;
  }

  positiveInteger() {
    this._rules.push((val) => {
      if (!Number.isInteger(val) || val < 1) {
        return `${this._field} must be a positive integer`;
      }
      return null;
    });
    return this;
  }

  validate(val) {
    const errors = [];

    if (val === undefined || val === null || val === '') {
      if (this._isRequired) {
        errors.push(`${this._field} is required`);
      }
      return errors;
    }

    if (this._type === 'string' && typeof val !== 'string') {
      errors.push(`${this._field} must be a string`);
      return errors;
    }

    if (this._type === 'number' && typeof val !== 'number') {
      errors.push(`${this._field} must be a number`);
      return errors;
    }

    if (this._type === 'array' && !Array.isArray(val)) {
      errors.push(`${this._field} must be an array`);
      return errors;
    }

    if (this._type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
      errors.push(`${this._field} must be an object`);
      return errors;
    }

    for (const rule of this._rules) {
      const error = rule(val);
      if (error) errors.push(error);
    }

    return errors;
  }
}

class SchemaValidator {
  constructor(schema) {
    this._schema = schema;
  }

  validate(data) {
    const errors = [];

    for (const [field, validator] of Object.entries(this._schema)) {
      const val = data[field];
      const fieldErrors = validator.validate(val);
      errors.push(...fieldErrors);
    }

    return errors;
  }
}

const vsl = {
  field: (name) => new FieldValidator(name),

  schema: (schemaObj) => new SchemaValidator(schemaObj),

  formatError: (errors) => ({
    status: 'error',
    message: errors[0] || 'Validation failed',
    errors,
  }),

  validateLinks: (links) => {
    const errors = [];
    if (!Array.isArray(links)) {
      errors.push('links must be an array');
      return errors;
    }
    links.forEach((link, i) => {
      if (!link.title || typeof link.title !== 'string') {
        errors.push(`links[${i}].title is required and must be a string`);
      } else if (link.title.length < 1 || link.title.length > 100) {
        errors.push(`links[${i}].title must be between 1 and 100 characters`);
      }
      if (!link.url || typeof link.url !== 'string') {
        errors.push(`links[${i}].url is required and must be a string`);
      } else if (link.url.length > 200) {
        errors.push(`links[${i}].url must be at most 200 characters`);
      } else if (!/^https?:\/\//i.test(link.url)) {
        errors.push(`links[${i}].url must start with http:// or https://`);
      }
    });
    return errors;
  },

  validateServiceRates: (serviceRates) => {
    const errors = [];
    const validCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];

    if (typeof serviceRates !== 'object' || Array.isArray(serviceRates)) {
      errors.push('service_rates must be an object');
      return errors;
    }

    if (!serviceRates.currency) {
      errors.push('service_rates.currency is required');
    } else if (!validCurrencies.includes(serviceRates.currency)) {
      errors.push(`service_rates.currency must be one of: ${validCurrencies.join(', ')}`);
    }

    if (!serviceRates.rates || !Array.isArray(serviceRates.rates) || serviceRates.rates.length === 0) {
      errors.push('service_rates.rates must be a non-empty array');
    } else {
      serviceRates.rates.forEach((rate, i) => {
        if (!rate.name || typeof rate.name !== 'string') {
          errors.push(`service_rates.rates[${i}].name is required and must be a string`);
        } else if (rate.name.length < 3 || rate.name.length > 100) {
          errors.push(`service_rates.rates[${i}].name must be between 3 and 100 characters`);
        }
        if (rate.description !== undefined && rate.description !== null) {
          if (typeof rate.description !== 'string') {
            errors.push(`service_rates.rates[${i}].description must be a string`);
          } else if (rate.description.length > 250) {
            errors.push(`service_rates.rates[${i}].description must be at most 250 characters`);
          }
        }
        if (rate.amount === undefined || rate.amount === null) {
          errors.push(`service_rates.rates[${i}].amount is required`);
        } else if (!Number.isInteger(rate.amount) || rate.amount < 1) {
          errors.push(`service_rates.rates[${i}].amount must be a positive integer`);
        }
      });
    }

    return errors;
  },
};

module.exports = vsl;
