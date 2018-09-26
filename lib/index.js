'use strict';

const path = require('path');
const fs = require('fs');
const browlUtil = require('browl-util');
const NullStrategy = require('browl-null');
const debug = require('debug')('browl-loader');

// eslint-disable-next-line no-unused-vars
module.exports = (rootConfig, repo, repoConfig) => {
  debug('init');

  const pathToCustomModule = path.join(rootConfig.conf_dir, repo, 'deploy');
  debug('path to custom module: %s', pathToCustomModule);

  if (fs.existsSync(pathToCustomModule)) {
    debug('clean cache');
    delete require.cache[require.resolve(pathToCustomModule)];

    try {
      debug('installing dependencies');
      const pathToPkg = path.join(pathToCustomModule, 'package.json');
      debug('path to package.json: %s', pathToPkg);
      delete require.cache[require.resolve(pathToPkg)];

      const pkg = require(pathToPkg);
      const dependencies = Object.keys(pkg.dependencies || {}).map(x => `${x}@${pkg.dependencies[x]}`);
      const options = {
        cwd: pathToCustomModule
      };

      debug('dependencies: %j', dependencies);
      debug('options: %j', options);
      dependencies.forEach(x => browlUtil.installModule(x, options));
    } catch (err) {
      debug('unable to install dependencies. reason: %s', err);
    }

    return require(pathToCustomModule);
  }

  debug('fallback to null strategy');

  return NullStrategy;
};
