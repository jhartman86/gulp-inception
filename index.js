'use strict';

// Dependencies
var _               = require('lodash'),
    gulpUtil        = require('gulp-util'),
    vinylFs         = require('vinyl-fs'),
    through2        = require('through2'),
    concatStream    = require('concat-stream'),
    path            = require('path');

// Defaults
var defaultOptions  = {
  wrapTag:    'script',
  indicator:  '<!-- PARTIALS -->',
  attributes: {
    type: 'text/template',
    id: function( fileInfo ){ return path.join(fileInfo.dir, fileInfo.base); }
  },
  pipeThrough: null
};

/**
 * Export function that receives options and returns a stream handler.
 * @param  {object} passedOptions {...}
 * @return {stream}               Through2 stream handler.
 */
module.exports = function( passedOptions ){
      // Merge default options with passed in options
  var options = _.merge({}, defaultOptions, passedOptions),
      // Transformer function (wrapper)
      transformer = getTransformer(options);

  return through2.obj(function( targetFile, encoding, done ){
    var self = this;

    try {
      /********* Loosely validate options parameters *********/
      if( ! _.isArray(options.files) ){
        throw new Error('`files` parameter required in options (array).');
      }

      if( ! _.isString(options.wrapTag) ){
        throw new Error('`wrapTag` parameter must be a string.');
      }

      if( ! _.isString(options.indicator) ){
        throw new Error('`indicator` parameter must be a string.');
      }

      /********* Check target actually contains indicator string *********/
      var targetContents = targetFile.contents.toString();
      if( targetContents.indexOf(options.indicator) === -1 ){
        throw new Error('src target does not contain a string (`indicator`) ' +
        'where contents should be injected.');
      }

      vinylFs
        // "find all the files specified by options.files grep except the
        // one we'll be adding the results into"
        .src(options.files.concat([`!${targetFile.path}`]))
        // pipe through another processor before merging all files into the
        // target? if not set, will use .noop() by default
        .pipe(options.pipeThrough || gulpUtil.noop())
        // take all the files in the stream, concat into one stream,
        // map->transform all of them into a new buffer, and set that buffer
        // as the contents on the target file (replacing the "indicator" in
        // the target stream)
        .pipe(concatStream(function( collection ){
          targetFile.contents = new Buffer(
            targetContents.replace(
              options.indicator, collection.map(transformer).join('\n')
            )
          );
          self.push(targetFile);
          done();
        }));
    }catch(e){
      return done(new gulpUtil.PluginError('gulp-inception', e.message));
    }
  });
};

/**
 * Return a transformer function, with options enclosed.
 * @param  {object} optionsContext Options
 * @return {function}              Transform function
 */
function getTransformer( optionsContext ){
  return function( buffer ){
    var attrs = processAttributes(optionsContext.attributes, buffer),
        tag   = optionsContext.wrapTag;
    return `<${[tag, attrs].join(' ')}>${buffer.contents}</${tag}>`;
  };
}

/**
 * Return an object with a .toString() method, that when invoked with output
 * the attributes as a string.
 * @param  {object} attributes  Attributes map
 * @param  {fs} fileObj         File obj (stream)
 * @return {object}             Quacks like a string
 */
function processAttributes( attributes, fileObj ){
  return {
    toString: function(){
      return _.map(
        // make normalized and processed key value pair map
        _.reduce(attributes, function reducer(target, value, key){
          target[key] = _.isFunction(value) ? value(path.parse(fileObj.path)) : value;
          return target;
        }, {}),
        // turn key values into array we can .join()
        function mapper(value, key){
          return `${key}="${value}"`;
        }
      ).join(' ');
    }
  };
}

/**
 * For testing, so we can introspect private methods.
 */
if(process.env.NODE_ENV === 'test'){
  module.exports.unit = {
    getTransformer: getTransformer,
    processAttributes: processAttributes
  };
}
