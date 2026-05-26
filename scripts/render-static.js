'use strict';
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderStatic() {
    const srcPath = upath.resolve(upath.dirname(__filename), '../src/static');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist');

    if (!sh.test('-e', srcPath)) return;

    sh.ls(srcPath).forEach(file => {
        const src = upath.join(srcPath, file);
        const dest = upath.join(destPath, file);
        sh.cp('-R', src, dest);
        console.log(`### INFO: Copied static: ${file} → dist/${file}`);
    });
};
