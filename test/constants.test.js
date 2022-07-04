/* eslint-disable */

import { DRIVER } from "../src/constants.js";

describe('Constant test', () => {
  it('should run default driver', async () => {
    DRIVER.getCollection();
    DRIVER.close();
  });
});