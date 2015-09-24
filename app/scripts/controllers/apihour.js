'use strict';

/**
 * @ngdoc function
 * @name quasarFrontendApp.controller:ApihourCtrl
 * @description
 * # ApihourCtrl
 * Controller of the quasarFrontendApp
 */
angular.module('quasarFrontendApp')
  .controller('ApihourCtrl', ['$scope', 'quasarApi', function ($scope, quasarApi) {
    	$scope.devices = [];
    	$scope.mqttClient = null;

    	$scope.loadState = {
    		'devices': false,
    		'initialData': false,
    		'mqttConnection': false
    	};


    	$scope.datad3 = [
	      {name: 'Greg', score: 98},
	      {name: 'Ari', score: 96},
	      {name: 'Q', score: 75},
	      {name: 'Loser', score: 48}
	    ];

    	function loadDevices(){
    		if($scope.loadState.devices !== true){
	    		quasarApi.getDevices().then(function(response){
	    			$scope.devices = response.data;
	    			if(response.data.length > 0){
	    				$scope.loadState.devices = true;
	    				loadInitialData();
	    			}else{
	    				$scope.loadState.devices = false;
	    			}
	    		}, function(error){
	    			console.log('Fallo al cargar los sensortags '+error);
	    			$scope.loadState.devices = false;
	    		}); 
	    	}
    	}

    	function loadInitialData(){
    		if($scope.loadState.initialData !== true){
    			for(var i=0; i<$scope.devices.length; i++){
    				$scope.loadDeviceData($scope.devices[i]);
    			}
    			console.log($scope.devices);
    		}
    	}

    	$scope.loadDeviceData = function(device){
    		quasarApi.getSensorData(device.device).then(function(response){
    			device.info = response.data;
    			startListening();
    		}, function(error){
    			console.log('Fallo al cargar los historicos de '+device.device+' '+error);
    		});
    	};

    	loadDevices();

    	function startListening(){

    		if($scope.loadState.mqttConnection !== true){
    			$scope.loadState.mqttConnection = true;

	    		$scope.mqttClient = mqtt.connect('mqtt://52.18.80.55:8081'); // jshint ignore:line
	    		//console.log('Client created at '+ Date());
	    		$scope.mqttClient.on('connect', function(){
	    			console.log('Im connected ' + Date());
	    			$scope.mqttClient.subscribe('quasar/#'); 
	    			$scope.loadState.mqttConnection = true;
	    		});

	    		$scope.mqttClient.on('reconnect', function(){
	    			console.log('Im reconnected ' + Date());
	    			$scope.mqttClient.subscribe('quasar/#'); 
	    			$scope.loadState.mqttConnection = false;
	    		});

	    		$scope.mqttClient.on('close', function(){
	    			console.log('Im close ' + Date()); 
	    			$scope.loadState.mqttConnection = false;
	    		});

	    		$scope.mqttClient.on('offline', function(){
	    			console.log('Im offline ' + Date());
	    			$scope.loadState.mqttConnection = false;
	    		});

	    		$scope.mqttClient.on('error', function(error){
	    			console.log('Im error ' + error + Date());
	    			$scope.loadState.mqttConnection = false;
	    		});

				$scope.mqttClient.on('message', function (topic, message) {
					console.log(topic);
					console.log(message);
					console.log('--------');
				});

				console.log($scope.mqttClient);
			}
    	}
	
  }]);
