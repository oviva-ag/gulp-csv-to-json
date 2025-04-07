var through = require('through2');
var PluginError = require('plugin-error');
var log = require('fancy-log');
var colors = require('ansi-colors');
var Vinyl = require('vinyl');
var path = require('path');

var csvjson = require('./lib/index');

var extendOptions = function(optionsObject) {
	var defaultOptions = {
		parserOptions: {
			auto_parse: true
		},
		processValue: function(key, value) {
			if (key !== '') {
				return value;
			}
		}
	};

	if (typeof optionsObject !== 'object') {
		return defaultOptions;
	}

	for (var k in optionsObject) {
		defaultOptions[k] = optionsObject[k];
	}
	return defaultOptions;
};

module.exports = function(options) {
	options = extendOptions(options);

	return through.obj(function(file, enc, cb) {

		var self = this;


		if (file.isNull()) {
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new PluginError('gulp-csv2json', 'Streaming not supported'));
		}

		if (['.csv'].indexOf(path.extname(file.path)) === -1) {
			log('gulp-csv-to-json: Skipping unsupported csv ' + colors.blue(file.relative));
			return cb(null, file);
		}


		csvjson.process(file.contents, options, function(err, sets) {
			sets.forEach(function(set) {

				var outputString = JSON.stringify(set.data).replace(/\\\\n/g, '\\n');
				var mydata = Buffer.from(outputString, 'utf8');
                var base = path.join(file.path, '..');

                var jso = new Vinyl({
                    base: base,
                    path: path.join(base, set.name+'.json'),
                    contents: mydata
                });
                
                self.push(jso);
			});

			cb();
		});	
	});
};