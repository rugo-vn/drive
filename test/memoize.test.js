/* eslint-disable */

import { join } from "ramda";
import { expect} from "chai";
import createMemoizeWith, { globalCaches } from "../src/memoize.js";

describe('Memoize test', () => {
  it('should run', async () => {
    const sum = (a, b) => a + b;

    const memoizedSum = createMemoizeWith('demo', (...args) => join(',', args), sum);

    expect(globalCaches).to.has.property('demo');

    let r = memoizedSum(1, 2);

    expect(r).to.be.eq(3);
    expect(globalCaches.demo).to.has.property('1,2', 3);

    r = memoizedSum(1)(3);
    expect(r).to.be.eq(4);
    expect(globalCaches.demo).to.has.property('1,3', 4);
  });
});