'use strict';

/**
 * @ngdoc overview
 * @name quasarFrontendApp
 * @description
 * # quasarFrontendApp
 *
 * Main module of the application.
 */
angular
  .module('quasarFrontendApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'd3'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'ApihourCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
