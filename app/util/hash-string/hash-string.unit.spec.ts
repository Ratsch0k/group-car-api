import hashString from './hash-string';
import {expect} from 'chai';

describe('hash-string', function() {
  it('creates for the same string ' +
      'and seed the same number', async function() {
    const string = 'TEST';
    const seed = 12;

    const actual1 = await hashString(string, seed);
    const actual2 = await hashString(string, seed);
    expect(actual1).to.be.eql(actual2);
  });

  it('creates different number for ' +
      'same string but different seed', async function() {
    const string = 'TEST';
    const seed1 = 12;
    const seed2 = 23;

    const actual1 = await hashString(string, seed1);
    const actual2 = await hashString(string, seed2);
    expect(actual1).to.not.be.eql(actual2);
  });

  it('creates different numbers ' +
      'for different strings but same seed', async function() {
    const string1 = 'TEST';
    const string2 = 'OTHER';
    const seed = 1;

    const actual1 = await hashString(string1, seed);
    const actual2 = await hashString(string2, seed);
    expect(actual1).to.not.be.eql(actual2);
  });

  it('creates different numbers for different ' +
      'string and seeds', async function() {
    const string1 = 'TEST';
    const string2 = 'OTHER';
    const seed1 = 1;
    const seed2 = 14;

    const actual1 = await hashString(string1, seed1);
    const actual2 = await hashString(string2, seed2);
    expect(actual1).to.not.be.eql(actual2);
  });

  it('produces same numbers as expected', async function() {
    const strings = ['TEST', 'OTHER', 'DIFFERENT', 'STRING'];
    const seeds = [0, 4, 12, 14];
    const expectedValue = [
      7662275108988672,
      325964699590494,
      6602764949475403,
      7900079600016987,
    ];

    for (let i = 0; i < strings.length; i++) {
      expect(await hashString(strings[i], seeds[i])).to.equal(expectedValue[i]);
    }
  });
});
