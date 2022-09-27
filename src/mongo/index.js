import { path } from 'ramda';
import { MongoClient } from 'mongodb';

import { RugoError } from '@rugo-vn/service';

export const name = 'driver.mongo';

export * as actions from './actions.js';
export * as hooks from './hooks.js';

export const started = async function () {
  const mongoUri = path(['settings', 'driver', 'mongo'], this);

  if (!mongoUri) {
    throw new RugoError('Mongo settings was not defined.');
  }

  this.client = await new Promise((resolve, reject) => {
    MongoClient.connect(mongoUri, { useUnifiedTopology: true }, (err, client) => {
      if (err) {
        reject(err);
        return;
      }

      this.logger.info('Connected to mongodb server.');
      resolve(client);
    });
  });

  this.db = this.client.db();
  this.registers = {};
};

export const closed = async function () {
  await this.client.close();
};
