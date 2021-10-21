'use strict';

// Modules 호출
var gulp = require('gulp');

// Gulp 의 concat 패키지 모듈 호출 - 자바스크립트 파일을 하나의 파일로 병합해 주는 플러그인입니다.
// 파일 간의 병합이 알파벳 순서대로 병합되기 때문에 스크립트 처리 순서에 이슈가 발생할 수 있을 것입니다.
var concat = require('gulp-concat');

// 주석, 공백 등을 제거하고, 변수명을 짧게 바꾸는 등의 작업을 통해 파일 용량을 줄여주는 플러그인
var uglify = require('gulp-uglify');

var rename = require('gulp-rename');

var sourcemaps = require('gulp-sourcemaps');

// var scss = require('gulp-sass');
var scss = require('gulp-sass')(require('sass'));

var browserSync = require('browser-sync').create();

// 템플릿 페이지를 사용하게 해주는 플러그인
var nunjucksRender = require('gulp-nunjucks-render');

const postcss = require('gulp-postcss');
const pxtorem = require('postcss-pxtorem');


/**
 * ==========================
 * 경로들을 담을 객체 생성
 * ==========================
 */
var src = './src';
var dist = './dist';
var paths = {
	js: src + './src/js/**/*.js',
	scss: src + './src/sass/**/*.scss',
	html: src + '/**/*.html',
}

const plugins = [
	pxtorem({
		rootValue: '15', // 루트 글꼴 크기
		propList: ['*'], // px -> rem 변경
		unitPrecision: 2, // REM 단위가 증가할 수 있는 십진수 값
		mediaQueries: false, // 미디어 쿼리에서 px가 변환 허용 값
	})
];

/**
 * ==========================
 * @task : HTML 반영
 * ==========================
 */
gulp.task('html', function() {
	return gulp
		.src('./src/html/**/*.html')
		.pipe(nunjucksRender({
			envOptions: {
				autoescape: false
			},
			// manageEnv: manageEnvironment,
			path: ['./']
		}))
		.pipe(gulp.dest('./dist/html'))
		.pipe(browserSync.reload({stream: true}));
});

/**
 * ==========================
 * @task : Script 병합,압축,min 파일 생성
 * Gulp.task()를 사용해 gulp-concat 업무 수행을 정의 
 * task 의 이름은 가능하면 플러그인과 연관성있는 이름을 정의하는 것이 좋습니다. 
 * ==========================
 */
gulp.task('js:combine', function() {
	return gulp
		.src('./src/js/**/*.js') // js 하위 디렉터리 내의 모든 자바스크립트 파일을 가져온다.
		.pipe(concat('conbined.js'))
		.pipe(gulp.dest(dist+'/js')) // 저장 경로 지정
		// 파일을 병합 후 uglify를 수행한다.
		.pipe(uglify())
		.pipe(rename('combined.min.js')) // min 네이밍으로 파일 생성
		.pipe(gulp.dest(dist+'/js'))
		.pipe(browserSync.reload({stream: true}));
});

/**
 * ==========================
 * @SCSS : SCSS Config(환경설정)
 * ==========================
 */
var scssOption = {
	/** 
	 * outputStyle (Type : String , Default : nested) 
	 * CSS의 컴파일 결과 코드스타일 지정 * Values : nested, expanded, compact, compressed 
	 */
	outputStyle: "expanded",

	/** 
	 * indentType (>= v3.0.0 , Type : String , Default : space)
	 * 컴파일 된 CSS의 "들여쓰기" 의 타입
	 * Values : space , tab
	 */
	indentType: "tab",

	/** 
	 * indentWidth (>= v3.0.0, Type : Integer , Default : 2)
	 * 컴파일 된 CSS의 "들여쓰기" 의 갯수
	 */
	indentWidth: 1, // outputStyle 이 nested, expanded 인 경우에 사용

	/** 
	 * precision (Type : Integer , Default : 5)
	 * 컴파일 된 CSS 의 소수점 자리수.
	 */
	precision: 6,

	/** 
	 * sourceComments (Type : Boolean , Default : false)
	 * 컴파일 된 CSS 에 원본소스의 위치와 줄수 주석표시.
	 */
	sourceComments: true
}

/**
 * ==========================
 * @task : SCSS Compile & sourcemaps
 * ==========================
 */
gulp.task('scss:compile', function() {
	return gulp
		// SCSS 파일을 읽어온다.
		.src('./src/sass/**/*.scss')
		.pipe(concat('style.css'))
		// 소스맵 초기화(소스맵을 생성)
		.pipe(sourcemaps.init())
		// SCSS 함수에 옵션갑을 설정, SCSS 작성시 watch 가 멈추지 않도록 logError 를 설정
		.pipe(scss(scssOption).on('error', scss.logError))
		// 위에서 생성한 소스맵을 사용한다.
		.pipe(sourcemaps.write())
		// 목적지(destination)을 설정
		.pipe(postcss(plugins))
		.pipe(gulp.dest(dist + '/css'))
		.pipe(browserSync.reload({stream: true}));
});

/**
 * ==========================
 * @task : browserSync
 * ==========================
 */
 gulp.task('browserSync', function() {
	return browserSync.init({
		port: 3334,
		server: {
			baseDir: './'
		}
	})
});

/**
 * ==========================
 * @task : html:index
 * ==========================
 */
 gulp.task('html:index', function() {
	return gulp
		.src('./guide/**/*.html')
		.pipe(nunjucksRender({
			envOptions: {
				autoescape: false
			},
			// manageEnv: manageEnvironment,
			path: ['./']
		}))
		.pipe(gulp.dest('./'))
		.pipe(browserSync.reload({ stream: true }));
});

/**
 * ==========================
 * 지속적인 업무 관찰을 위해 watch 등록. 즉, 파일 변경을 감지한다.
 * ==========================
 */
gulp.task('watch', function() {
	// 1. 감지할 디렉터리를 정의
	// 2. 변경이 감지되면 실행할 task 를 지정
	gulp.watch('./guide/**/*.html', gulp.series('html:index'));
	gulp.watch('./src/html/**/*.html', gulp.series('html'));
	gulp.watch('./src/js/*.js', gulp.series('js:combine'));
	gulp.watch('./src/sass/*.scss', gulp.series('scss:compile'));
})

gulp.task('default', gulp.parallel('html', 'html:index', 'js:combine', 'scss:compile', 'watch', 'browserSync'));