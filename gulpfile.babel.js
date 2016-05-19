import gulp from 'gulp';
import path from 'path';
import cp from "child_process";
import runSequence from 'run-sequence';
import del from "del";
import gulpLoadPlugins from 'gulp-load-plugins';

var server, db;

//CONFIG
let CONFIG = {
};
// source code folder
CONFIG.source='src';
// client source code
CONFIG.client=path.join(CONFIG.source, 'client');
// server source code
CONFIG.server=path.join(CONFIG.source, 'server');
CONFIG.packages=path.join(CONFIG.source, 'packages');
// generate dist folder
CONFIG.dist= 'dist';
CONFIG.public=path.join(CONFIG.dist, 'public');
CONFIG.serverDist=path.join(CONFIG.dist, 'server');
CONFIG.packagesDist =path.join(CONFIG.dist, 'packages');

CONFIG.clientLibs = [
  "jquery/dist/jquery.js",
  'd3/d3.js',
  'lodash/lodash.js',
  'systemjs/dist/system-polyfills.src.js',
  'reflect-metadata/Reflect.js',
  'es6-shim/es6-shim.js',
  'systemjs/dist/system.src.js',
  'angular2/bundles/angular2-polyfills.js',
  'rxjs/bundles/Rx.js',
  'angular2/bundles/angular2.js',
  'angular2/bundles/router.js',
  'angular2/bundles/http.js',
  'postal/lib/postal.js',
  'pouchdb/dist/pouchdb.js',
  "ng2-bs3-modal/bundles/ng2-bs3-modal.min.js",
  "bootstrap/dist/js/bootstrap.js",
  "moment/min/moment-with-locales.min.js"
];

CONFIG.clientLibStyles = [
  'bootstrap/dist/css/**/*',
  'bootstrap/dist/fonts/**/*'
];

// load gulp plugins
const $ = gulpLoadPlugins();

gulp.task("default", ()=>{
  runSequence(
    ["build:dev"]
  )
});

gulp.task("build", () => {
  runSequence([
    'clean:dev',
    'copy:dev',
    'build:ts:dev',
    'install:dev',
    'concat:lib'
  ])
});

gulp.task("dev", ()=>{
  runSequence(
    "build:dev",
    "watch"
  )
});

gulp.task("build:dev", ()=>{
  runSequence(
    'clean:dev',
    'copy:dev',
    'build:ts:dev',
    'install:dev',
    'concat:lib',
    'start:dev'
  );
});

gulp.task("client:dev", ()=>{
  runSequence(
    'clean:client:dev',
    'install:client:dev',
    'copy:client:dev',
    'build:ts:dev',
    'concat:lib'
  );
});

gulp.task("server:dev", ()=>{
  runSequence(
    'clean:server:dev',
    'copy:server:dev',
    'install:serverDist:dev',
    'start:dev'
  );
});

gulp.task("watch", ()=>{
  //TODO. when file changes, just run the necessary tasks
  gulp.watch(['**', '**/*', '!**/node_modules/**'], {cwd: CONFIG.client}, ['client:dev']);

  gulp.watch(['**', '**/*', '!**/node_modules/**'], {cwd: CONFIG.server}, ['server:dev']);

});

gulp.task("clean:dev", ['clean:client:dev', 'clean:server:dev'],()=>{
});

gulp.task("clean:client:dev", ()=>{
  del.sync(["public/**/*", "!public/web.log", "!public/engine.log"], {cwd: CONFIG.dist});
});

gulp.task("clean:server:dev", ['copy:packages:dev'], ()=>{
  del.sync(["**/*", "!node_modules/**", "!data/**", '!log.txt'], {cwd: CONFIG.serverDist});
});


//[Optional]
gulp.task("tslint", ()=>{

});

// Copy files
//gulp.task("copy:dev", ["copy:client:dev", "copy:server:dev"], ()=>{
gulp.task("copy:dev", ["copy:client:dev", "copy:server:dev"], ()=>{

});

gulp.task("copy:client:dev", ()=>{
  return gulp.src(['**/*', "!**/*.ts", "!**/*.js", "!**/*.js.map", "!**/node_modules/**"], {cwd: CONFIG.client})
    .pipe(gulp.dest(CONFIG.public))
});

gulp.task("copy:client:lib", ()=>{
  return gulp.src(CONFIG.clientLibStyles, {cwd: path.join(CONFIG.client, "node_modules")})
    .pipe(gulp.dest(path.join(CONFIG.public, "assets")));
});

gulp.task("copy:server:dev", ()=>{
  return gulp.src(["**/*", "package.json", "!**/node_modules/**"], {cwd: CONFIG.server})
    .pipe(gulp.dest(CONFIG.serverDist))
});

gulp.task("copy:packages:dev", ()=>{
  return gulp.src(["**/*"], {cwd: CONFIG.packages})
    .pipe(gulp.dest(CONFIG.packagesDist))
});

gulp.task("build:ts:dev", ()=>{
  let _tsProject = $.typescript.createProject('tsconfig.json', {
    typescript: require('typescript')
  });
  return gulp.src(["../../typings/browser.d.ts", "**/*.ts", "**/*.spec.ts", "!**/*.e2e.ts", "!node_modules/**/*.ts"], {cwd: CONFIG.client})
    .pipe($.typescript(_tsProject))
    .pipe(gulp.dest(CONFIG.public));
});

gulp.task("concat:lib", ()=>{
  return gulp.src(CONFIG.clientLibs, {cwd: path.join(CONFIG.client, "node_modules")})
    .pipe($.concat("lib.js"))
    .pipe(gulp.dest(path.join(CONFIG.public, "js")))
});

gulp.task("uglify:lib", ()=>{
  return gulp.src(path.join(CONFIG.public, "js", "lib.js"))
    .pipe($.uglify())
    .pipe(gulp.dest(path.join(CONFIG.public, "js")));
});

gulp.task("build:index:dev", ()=>{

});

gulp.task("install:dev", ['install:client:dev', 'install:serverDist:dev'], ()=>{
});

gulp.task("install:client:dev", ()=>{
  cp.execSync("npm install", {cwd: CONFIG.client});
});

gulp.task("install:serverDist:dev", ()=>{
  cp.execSync("npm install", {cwd: CONFIG.serverDist});
});

gulp.task("start:dev", ()=>{

  // TODO don't need to restart db every change
  if(!server && !db){
    server = cp.spawn('npm', ['run', 'start-server'], {cwd: CONFIG.serverDist, stdio: 'inherit'});
    db = cp.spawn("npm", ["run", "start-db"], {cwd: CONFIG.serverDist, stdio: 'inherit'});
  }else{
    server.kill();
    db.kill();
    cp.execSync("killall node");
    server = cp.spawn('npm', ['run', 'start-server'], {cwd: CONFIG.serverDist, stdio: 'inherit'});
    db = cp.spawn("npm", ["run", "start-db"], {cwd: CONFIG.serverDist, stdio: 'inherit'});
  }

});
