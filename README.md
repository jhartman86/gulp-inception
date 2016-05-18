# gulp-inception

> Inject and wrap contents of multiple files into a single file.

[![Build Status](https://travis-ci.org/jhartman86/gulp-inception.svg?branch=master)](https://travis-ci.org/jhartman86/gulp-inception)

Pretend you have three files, `a.html`, `b.html`, and `index.html`. You use a
snazzy javascript library like angular or something, where you want to have
access to html partials / template strings. You want to write your templates
in different files, but for releases, have those templates automatically
wrapped in `<script type="text/template">...</script>` tags, and merged into
another file (like `index.html`). In this scenario, lets say merge the contents
of `a,b` -> `index`. Here are your source files:

**Contents of `a.html`**: `<ul><li for-in="..."><a>...</a></li></ul>`

**Contents of `b.html`**: `<div class="whatevs"><img data-src="{{i}}" /></div>`

**Contents of `index.html`**:
```
<html>
<head><title>Super</title></head>
<body>
  <div><p>stuff here</p></div>
  ...
<!-- PARTIALS -->
</body>
</html>
```

Then you run this gulp task. And get one file, `index.html`, with contents:
```
<html>
<head><title>Super</title></head>
<body>
  <div><p>stuff here</p></div>
  ...

<script type="text/template" id="/a.html">
<ul><li for-in="..."><a>...</a></li></ul>
</script>

<script type="text/template" id="/b.html">
<div class="whatevs"><img data-src="{{i}}" /></div>
</script>

</body>
</html>
```

Boom roasted. **Note**: this example is just the use-case it was written for.
If you have other scenarios where you need to pull the contents of multiple
files into one, this library should work just fine (but not javascript, just use
[concat](https://github.com/contra/gulp-concat)).

## Installation

Install with NPM and add to your development dependencies:

`npm install --save-dev gulp-inception`

## Usage

Minimum required:

```
var gulp = require('gulp'),
    gulpInception = require('gulp-inception');

gulp.task('make-html', function(){
  gulp.src('index.html') // file to merge INTO (eg. "target")
    .pipe(gulpInception({
      files: ['markup/**/*.html'] // files to merge into "target"
    }))
    .pipe(gulp.dest('...'));
});
```

## Options

* `files` array | required

  `gulp.src()` style file matcher: these are the files you want to merge _into_
  the source stream.

  ```
  {
    files: ['some/path/**/*.html']
  }
  ```


* `wrapTag` string | optional (default: `script`)

  The contents of the files will be wrapped in enclosing tags upon injecting
  to the target, by default using `<script>...</script>`. If you wanted to
  customize the tag name to be `<my-component-type>...</my-component-type>`,
  use this.

  ```
  {
    wrapTag: 'my-component-type'
  }
  ```


* `indicator` string | optional (default: `<!-- PARTIALS -->`)

  Where `gulp-inception` looks in your _target_ file to inject All The Things™
  into. Put this wherever you want in your target file. If you don't want to
  use `<!-- PARTIALS -->`, customize it here.

  ```
  {
    indicator: '__INJECT_HERE__'
  }
  ```

  ... then in your target file, just so long as you have the string
  `__INJECT_HERE__` somewhere - there your merged files shall go.

* `attributes` object | optional (default: {id, type})

  The enclosing tag ("wrapTag") is decorated with attributes, by default it will
  have `id="..."` and `script="text/template"` attributes. To add more (or
  override the default `id` and `script`) attributes, pass map where key is
  the attribute type and value is a string. Alternatively, if you need these to
  be dynamic (say based on the file name or its path), pass a `function`.
  Functions will receive an object; the result of Node's `path.parse()`, which
  includes relevant file details.

  ```
  {
    attributes: {
      class: 'yolo',
      'data-abc': '1234',
      'data-path': function( fileInfo ){ // dynamic
        return '/path1/' + fileInfo.base;
      }
    }
  }
  ```

  This would yield results like:
  ```
  <script class="yolo" data-abc="1234" data-path="/path1/a.html">...</script>
  <script class="yolo" data-abc="1234" data-path="/path1/b.html">...</script>
  ```

## Errors

`gulp-inception` will emit `Errors` under certain conditions (eg. if configs are invalid). In order to gracefully handle errors so this doesn't nuke your `.watch()`es, consider wiring up your gulp tasks like so:

```
gulp.task('make-html', function( done ){
  gulp.src('index.html') // file to merge INTO (eg. "target")
    .pipe(gulpInception({
      files: ['markup/**/*.html'] // files to merge into "target"
    }))
    .on('error', function(e){
      // do something with the error, like log with gulp-util
      done();
      // or if you DO want to stop...
      done(e);
    })
    .pipe(gulp.dest('...'));
});
```

## Releases

See [CHANGELOG.md](https://github.com/jhartman86/gulp-inception/blob/master/CHANGELOG.md)

## Contributing

Pull requests welcome. Please file any issues on the [issues page](https://github.com/jhartman86/gulp-inception/issues).

## License

MIT License
Copyright (c) 2016 Jonathan Hartman.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
