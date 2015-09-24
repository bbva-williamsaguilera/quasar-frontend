'use strict';

/**
 * @ngdoc service
 * @name quasarFrontendApp.quasarApi
 * @description
 * # quasarApi
 * Factory in the quasarFrontendApp.
 */
angular.module('quasarFrontendApp')
	.factory('quasarApi', ['$http', function ($http) {
		
		var host;
		var local = false;
		if(local){
			host = 'http://localhost:9000/api/';
		}else{
			host = 'http://52.18.80.55/api/';	
		}

		function getDevices(){
			return $http.get(host+'sensortag');
		}

		function getSensorData(device){
			return $http.get(host+'datum?device='+device);
		}

		return {
			getDevices: getDevices,
			getSensorData: getSensorData
		};
	}]);
