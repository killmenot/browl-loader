'use strict';

const path = require('path');
const fs = require('fs-extra');
const sinon = require('sinon');
const NullStrategy = require('browl-null');
const browlUtil = require('browl-util');
const browlLoader = require('../');

describe('browl-loader', () => {
  let sandbox;

  let rootConfig;
  let repo;
  let repoConfig;

  let fsMock;

  const tmpDir = path.join(__dirname, '../tmp');

  function resolve(p) {
    return path.join(tmpDir, p);
  }

  function mock() {
    fs.ensureDirSync(tmpDir);
    fs.ensureDirSync(rootConfig.conf_dir);

    return {
      restore: () => fs.removeSync(tmpDir)
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    rootConfig = {
      conf_dir: resolve('/etc/browl')
    };
    repo = 'webapp';
    repoConfig = {};

    fsMock = mock();
    sandbox.stub(browlUtil, 'installModule');
  });

  afterEach(() => {
    sandbox.restore();
    fsMock.restore();
  });

  it('should return null strategy', () => {
    const actual = browlLoader(rootConfig, repo, repoConfig);

    expect(actual).equal(NullStrategy);
  });

  xit('should return custom strategy when file', () => {
    const expected = 'test';

    fs.ensureDirSync(path.join(rootConfig.conf_dir, repo));
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy.js'), 'module.exports = function TestStrategy() { this.name = \'test\'; }');

    const TestStrategy = browlLoader(rootConfig, repo, repoConfig);
    const actual = new TestStrategy(repo, rootConfig, repoConfig);

    expect(browlUtil.installModule.notCalled).equal(true);
    expect(actual.name).equal(expected);
  });

  it('should return custom strategy without package.json', () => {
    const expected = 'test';

    fs.ensureDirSync(path.join(rootConfig.conf_dir, repo, 'deploy'));
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy/index.js'), 'module.exports = function TestStrategy() { this.name = \'test\'; }');

    const TestStrategy = browlLoader(rootConfig, repo, repoConfig);
    const actual = new TestStrategy(repo, rootConfig, repoConfig);

    expect(browlUtil.installModule.notCalled).equal(true);
    expect(actual.name).equal(expected);
  });

  it('should return custom strategy with package.json but no dependencies', () => {
    const expected = 'test';

    fs.ensureDirSync(path.join(rootConfig.conf_dir, repo, 'deploy'));
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy/index.js'), 'module.exports = function TestStrategy() { this.name = \'test\'; }');
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy/package.json'), '{}');

    const TestStrategy = browlLoader(rootConfig, repo, repoConfig);
    const actual = new TestStrategy(repo, rootConfig, repoConfig);

    expect(browlUtil.installModule.notCalled).equal(true);
    expect(actual.name).equal(expected);
  });

  it('should return custom strategy with package.json and dependencies', () => {
    const expected = 'test';

    fs.ensureDirSync(path.join(rootConfig.conf_dir, repo, 'deploy'));
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy/index.js'), 'module.exports = function TestStrategy() { this.name = \'test\'; }');
    fs.writeFileSync(path.join(rootConfig.conf_dir, repo, 'deploy/package.json'), '{"dependencies":{"debug": "^4.0.1"}}');

    const TestStrategy = browlLoader(rootConfig, repo, repoConfig);
    const actual = new TestStrategy(repo, rootConfig, repoConfig);

    expect(browlUtil.installModule).calledWith('debug@^4.0.1', { cwd: resolve('etc/browl/webapp/deploy')});
    expect(actual.name).equal(expected);
  });
});
