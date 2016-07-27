/**
 * Mock a simple plugin that takes a file input and just strips any linebreak
 * or return characters.
 */
module.exports = function() {
  return require('through2').obj(function ( targetFile, encoding, done ) {
    targetFile.contents = new Buffer(
      targetFile.contents.toString().replace(/\r?\n|\r/g, '')
    );
    this.push(targetFile);
    done();
  });
};
