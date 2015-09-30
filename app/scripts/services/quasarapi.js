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

		var today = moment().subtract(1,'days').format('YYYY-MM-DD');
		var limit = 2000;


		function getDevices(){
			return $http.get(host+'sensortag');
		}

		function getSensorData(device){
			return $http.get(host+'datum?device='+device+'&after='+today+'&limit='+limit);
		}

		function getGenericData(generic){
			return $http.get(host+'generic/'+generic+'?after='+today+'&limit='+limit);
		}

		return {
			getDevices: getDevices,
			getSensorData: getSensorData,
			getGenericData: getGenericData
		};
	}]);
