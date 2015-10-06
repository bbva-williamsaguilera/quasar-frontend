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

		var today = moment().subtract((5+2),'hours').format('YYYY-MM-DD hh:mm:ss');
		var limit = 500;


		function getDevices(){
			return $http.get(host+'sensortag');
		}

		function getSensorData(device){
			return $http.get(host+'datum?device='+device+'&after='+today+'&limit='+limit);
		}

		function getGenericData(generic,extra){
			if(extra != undefined){
				extra = '/'+extra;
			}else{
				extra = '';
			}
			return $http.get(host+'generic/'+generic+extra+'?after='+today+'&limit='+limit);
		}



		return {
			getDevices: getDevices,
			getSensorData: getSensorData,
			getGenericData: getGenericData
		};
	}]);
