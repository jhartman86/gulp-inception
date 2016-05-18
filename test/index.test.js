var _         = require('lodash'),
    fs        = require('fs'),
    path      = require('path'),
    assert    = require('assert'),
    through2  = require('through2'),
    gulp      = require('gulp');
require('mocha');

describe('gulp-inception', function(){
  var inception = require('../index');

  /**
   * There is a strong argument for "private methods shouldn't be tested b/c
   * they're implementation details". Agreed, but testing just makes writing
   * them easier, and validating that said private things are doing what
   * they're supposed to do if changes occur in the future.
   */
  context('units', function(){
    it('should return a callable', function(){
      assert.ok(_.isFunction(inception),
        'require() should return a callable (function)'
      );
    });

    it('should return transformer function with enclosed options', function(){
      var func = inception.unit.getTransformer({
            wrapTag: 'test',
            attributes: {
              one: 'two',
              three: 'four'
            }
          }),
          quackLikeAThrough2Buffer = {
            contents: 'LoremIpsum'
          };

      assert.equal(func(quackLikeAThrough2Buffer),
        '<test one="two" three="four">LoremIpsum</test>',
        'transformer should generate wrapper'
      );
    });

    it('should return object that prints formatted attributes when stringified',
      function(){
        var result = inception.unit.processAttributes({
          lorem: 'ipsum',
          // implicit: test that if its a func, its called, and passed fileInfo
          dolor: function( fileInfo ){
            return `custom/${fileInfo.dir.split('/').pop()}/${fileInfo.base}`;
          }
        }, {path: path.join(__dirname, __filename)});

        var thisFileInfo = path.parse(path.join(__dirname, __filename));
        assert.equal(result.toString(),
          `lorem="ipsum" dolor="custom/test/${thisFileInfo.base}"`,
          'string should be equal'
        );
      }
    );
  });

  context('integration', function(){

    describe('parameter validation', function(){
      it('should emit error if `files` property missing', function( done ){
        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({}))
          .on('error', function(e){
            assert.ok(e.message.match(/`files` parameter required/),
              'Error message for `files` incorrect.'
            );
            this.destroy();
            done();
          });
      });

      it('should emit error if wrapTag param not a string', function( done ){
        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({
            files: [fixturePath('files/depth0/dogs.html')],
            wrapTag: null
          }))
          .on('error', function(e){
            assert.ok(e.message.match(/`wrapTag` parameter/),
              'Error message for `wrapTag` incorrect.'
            );
            this.destroy();
            done();
          });
      });

      it('should emit error if `indicator` param not a string', function( done ){
        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({
            files: [fixturePath('files/depth0/dogs.html')],
            indicator: null
          }))
          .on('error', function(e){
            assert.ok(e.message.match(/`indicator` parameter/),
              'Error message for `indicator` incorrect.'
            );
            this.destroy();
            done();
          });
      });
    });

    it("should emit error if no indicator string present in target",
      function( done ){
        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({
            files: [fixturePath('files/depth0/dogs.html')],
            indicator: '_NOT_PRESENT_'
          }))
          .on('error', function(e){
            assert.ok(e.message.match(/src target does not contain/),
              'Error message for indicator not present incorrect.'
            );
            this.destroy();
            done();
          });
      }
    );

    it('should override the script tag to use <spanner>', function( done ){
      gulp.src(fixturePath('files/index.html'))
        .pipe(inception({
          files: [fixturePath('files/depth0/dogs.html')],
          wrapTag: 'spanner'
        }))
        .pipe(through2.obj(function( file, enc, complete ){
          assert.ok(file.contents.toString().match(/<spanner/),
            'Wrapper should be an opening <spanner> tag'
          );
          assert.ok(file.contents.toString().match(/<\/spanner/),
            'Wrapper should have a closing </spanner> tag'
          );
          complete();
        }))
        .on('finish', function(){
          this.destroy();
          done();
        });
    });

    it('should merge all matches into the target', function( done ){
      fs.readFile(fixturePath('result.txt'), 'utf8', function(err, result){
        if(err){ throw err; }

        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({
            files: [fixturePath('files/**/*.html')],
            wrapTag: 'scriptz',
            attributes: {
              id: function( fileInfo ){
                return fileInfo.base;
              }
            }
          }))
          .pipe(through2.obj(function( file, enc, complete ){
            assert.equal(file.contents.toString(), result,
              'Generated output did not match'
            );
            complete();
          }))
          .on('finish', function(){
            this.destroy();
            done();
          });
      });
    });

    /**
     * This test exists in order to make sure that when errors are issued,
     * they can be handled gracefully and not interrupt consecutively run
     * tasks by gulp. eg. something like gulp watch, where a failure can
     * propagate.
     */
    it('should allow graceful error handling', function( done ){
      gulp.task('task1', function( complete ){
        gulp.src(fixturePath('files/index.html'))
          .pipe(inception({
            files: [fixturePath('files/**/*.html')],
            indicator: null
          }))
          .on('error', function(e){
            complete();
          })
          .pipe(through2.obj(function( file, enc, complete ){
            assert(false, 'Should not reach this point with an error');
            this.destroy();
            complete();
          }));
      });

      gulp.task('task2', ['task1'], function( complete ){
        _.defer(function(){
          assert(true, 'Task 2 ran OK.');
          complete();
        });
      });

      gulp.task('all', ['task1', 'task2'], function(){
        assert(true, 'All tasks ran OK.');
        done();
      });

      gulp.run('all');
    });
  });
});

/**
 * Quick way to get absolute path to files.
 */
function fixturePath( _path ){
  return path.join(__dirname, './fixtures/', _path);
}
