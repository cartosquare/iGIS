var gulp = require('gulp');
var fs = require('fs');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var shell = require('gulp-shell');
var jsoneditor = require("gulp-json-editor");
var sequence = require('gulp-sequence');
var packager = require('electron-packager')
var appdmg = require('gulp-appdmg');

var packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

var version = packageJSON.version;
var fileName = 'IGIS';
var appName = 'IGIS';
var electronVersion = packageJSON.devDependencies['electron'];


gulp.task('clean', shell.task([
	'rm -Rf ./dist/*',
]));


gulp.task('build-release', function() {
	gulp.src(['./src/**', '!./src/*.js', '!./src/server/*.js', '!./src/package.json'])
		.pipe(gulp.dest('dist/app/'));

	gulp.src(['./src/*.js'])
		.pipe(uglify())
		.pipe(gulp.dest('dist/app/'));

	gulp.src(['./src/server/*.js'])
		.pipe(uglify())
		.pipe(gulp.dest('dist/app/server/'));

	return gulp.src("./src/package.json")
		.pipe(jsoneditor(function(json) {
			for (var key in json) {
				if (key == 'dev') {
					delete json[key];
				}
			}
			json['version'] = version;
			return json;
		}))
		.pipe(gulp.dest('dist/app/'));
});


gulp.task('release-osx', ['build-release'], function() {
	var releaseName = version + '/' + fileName + '-' + version + '-osx-x64';

	var moduleCmds = ['cp -rf node_modules dist/app/'];
	for (var name in packageJSON.devDependencies) {
		moduleCmds.push('rm -rf dist/app/node_modules/' + name);
	}
	//moduleCmds.push('cp -rf node_modules/node-gmap dist/app/node_modules/node-gmap');

	var packagerCmd = 'electron-packager dist/app';
	packagerCmd += ' "' + appName + '"';
	packagerCmd += ' --version="' + electronVersion + '"';
	packagerCmd += ' --icon=dist/app/app.icns';
	packagerCmd += ' --app-bundle-id="' + appName + '"';
	packagerCmd += ' --app-version="' + version + '"';
	packagerCmd += ' --version-string.FileVersion="' + version + '"';
	packagerCmd += ' --version-string.ProductName="' + appName + '"';
	packagerCmd += ' --version-string.ProductVersion="' + version + '"';
	packagerCmd += ' --version-string.CompanyName=GeoHey';
	packagerCmd += ' --version-string.FileDescription="' + appName + '"';
	packagerCmd += ' --out=dist --overwrite=true --arch=x64 --platform=darwin';

	return gulp.src('')
		.pipe(shell(['rm -f dist/app/bin/node.exe'])) // Windows node
		.pipe(shell(['rm -f dist/app/bin/node-linux'])) // Linux node
		.pipe(shell(moduleCmds))
		.pipe(shell([packagerCmd]))
		.pipe(shell('mkdir -p ' + version))
		.pipe(shell(['rm -f ' + releaseName + '.dmg']))
		.pipe(appdmg({
			target: releaseName,
			basepath: __dirname,
			specification: {
				"title": appName,
				"icon": "src/app.icns",
				"icon-size": 80,
				"contents": [{
					"x": 400,
					"y": 150,
					"type": "link",
					"path": "/Applications"
				}, {
					"x": 100,
					"y": 150,
					"type": "file",
					"path": 'dist/' + appName + '-darwin-x64/' + appName + '.app'
				}]
			}
		}));
});


gulp.task('build-release-win', ['build-release'], function() {
	var moduleCmds = ['mkdir -p dist/app/node_modules', 'rm -Rf dist/app/node_modules/*'];
	for (var name in packageJSON.dependencies) {
		moduleCmds.push('cp -rf node_modules/' + name + ' dist/app/node_modules/' + name);
	}
	moduleCmds.push('cp -rf node_modules/node-gmap-win dist/app/node_modules/node-gmap');

	var packagerCmd = 'electron-packager dist/app';
	packagerCmd += ' "' + appName + '"';
	packagerCmd += ' --version="' + electronVersion + '"';
	packagerCmd += ' --icon=dist/app/app.ico';
	packagerCmd += ' --app-bundle-id="' + appName + '"';
	packagerCmd += ' --app-version="' + version + '"';
	packagerCmd += ' --version-string.FileVersion="' + version + '"';
	packagerCmd += ' --version-string.ProductName="' + appName + '"';
	packagerCmd += ' --version-string.ProductVersion="' + version + '"';
	packagerCmd += ' --version-string.CompanyName=GeoHey';
	packagerCmd += ' --version-string.FileDescription="' + appName + '"';
	packagerCmd += ' --out=dist --overwrite=true --arch=x64 --platform=win32';

	return gulp.src('')
		.pipe(shell(['rm -f dist/app/bin/node'])) // Mac node
		.pipe(shell(['rm -f dist/app/bin/node-linux'])) // Linux node
		.pipe(shell(moduleCmds))
		.pipe(shell([packagerCmd]))
		.pipe(shell(['cp -rf vc_dist/* "dist/' + appName + '-win32-x64"']))
		.pipe(shell('mkdir -p ' + version));
});


gulp.task('release-win', ['build-release-win'], function() {
	var releaseFile = version + '/' + fileName + '-' + version + '-win-x64.zip';
	return gulp.src('dist/' + appName + '-win32-x64/**')
		.pipe(shell('rm -f ' + releaseFile))
		.pipe(zip(releaseFile))
		.pipe(gulp.dest('./'));
});


gulp.task('build-release-linux', ['build-release'], function() {
	var releaseName = version + '/' + fileName + '-' + version + '-linux-x64';

	var moduleCmds = ['mkdir -p dist/app/node_modules', 'rm -Rf dist/app/node_modules/*'];
	for (var name in packageJSON.dependencies) {
		moduleCmds.push('cp -rf node_modules/' + name + ' dist/app/node_modules/' + name);
	}
	moduleCmds.push('cp -rf node_modules/node-gmap-linux dist/app/node_modules/node-gmap');

	var packagerCmd = 'electron-packager dist/app';
	packagerCmd += ' "' + appName + '"';
	packagerCmd += ' --version="' + electronVersion + '"';
	packagerCmd += ' --icon=dist/app/app.ico';
	packagerCmd += ' --app-bundle-id="' + appName + '"';
	packagerCmd += ' --app-version="' + version + '"';
	packagerCmd += ' --version-string.FileVersion="' + version + '"';
	packagerCmd += ' --version-string.ProductName="' + appName + '"';
	packagerCmd += ' --version-string.ProductVersion="' + version + '"';
	packagerCmd += ' --version-string.CompanyName=GeoHey';
	packagerCmd += ' --version-string.FileDescription="' + appName + '"';
	packagerCmd += ' --out=dist --overwrite=true --arch=x64 --platform=linux';

	return gulp.src('')
		.pipe(shell(['rm -f dist/app/bin/node'])) // Mac node
		.pipe(shell(['rm -f dist/app/bin/node.exe'])) // Windows node
		.pipe(shell(moduleCmds))
		.pipe(shell([packagerCmd]))
		.pipe(shell('mkdir -p ' + version));
});


gulp.task('release-linux', ['build-release-linux'], function() {
	var releaseFile = version + '/' + fileName + '-' + version + '-linux-x64.zip';
	return gulp.src('dist/' + appName + '-linux-x64/**')
		.pipe(shell('rm -f ' + releaseFile))
		.pipe(zip(releaseFile))
		.pipe(gulp.dest('./'));
});


gulp.task('release-doc', function() {
	return gulp.src('')
		.pipe(shell('cp -f CHANGELOG.md ' + version + '/'));
});


gulp.task('default', ['dev']);


gulp.task('dev', shell.task([
	'electron src/',
]));


gulp.task('release', sequence(
	'clean', 'release-osx',
	'clean', 'release-win',
	/*'clean', 'release-linux',*/
	'release-doc'));

// EOF