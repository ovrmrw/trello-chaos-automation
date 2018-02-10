import { customRange } from '../src';

describe('customRange', () => {
  it('must return expected number array.', () => {
    const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const actual = customRange(1, 10);
    expect(actual).toEqual(expected);
  });
});
