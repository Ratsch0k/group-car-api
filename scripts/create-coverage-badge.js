#!/bin/bash/node

const http = require('http');
const fs = require('fs');
const coverageResult = require('../static/test/coverage/coverage-summary.json');

/**
 * Finds the option from the given list of command line arguments.
 * The "-" prefix is not needed for the option string.
 * @param {string[]} args A list of arguments
 * @param {string} option The option to find
 */
const findOption = (option) => {
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i] == `-${option}` && i < args.length - 1) {
      return args[i + 1];
    }
  }

  return null;
};

const thresholds = [
  {
    pct: 0,
    color: 'red',
  },
  {
    pct: 75,
    color: 'yellow',
  },
  {
    pct: 80,
    color: 'yellowgreen',
  },
  {
    pct: 85,
    color: 'green',
  },
  {
    pct: 95,
    color: 'brightgreen',
  },
];

const getColorForPct = (pct) => {
  let j = 0;
  for (let i = 1; i < thresholds.length; i++) {
    if (pct < thresholds[i].pct) {
      break;
    } else {
      j = i;
    }
  }

  return thresholds[j].color;
};

// Get options
const serverType = findOption('s');

const coverageType = findOption('c');

const link = findOption('l');

const outputDir = findOption('o');

if (!outputDir) {
  throw new Error('Output directory option has to be a path');
}

const coverage = coverageResult.total[coverageType];

if (coverage === undefined) {
  throw new Error(`${coverageType} doesn't seem to be a valid coverage type`);
}

const pct = coverage.pct;

const color = getColorForPct(pct);

// Create url for retrieving the badge from https://shields.io
let url = `http://img.shields.io/static/v1?label=${serverType ? `${serverType}%20` : ''}coverage&message=${pct}%&color=${color}`;
if (link) {
  url += `&link=${link}`
}

const outputPath = outputDir + '/badge.svg'

// Check if outputDir exists. If not create it
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const file = fs.createWriteStream(outputPath);

// Get badge and create the file
http.get(url, function(response) {
  response.pipe(file);
});