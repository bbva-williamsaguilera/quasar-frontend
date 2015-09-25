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

    	$scope.addRandomData = function(){
    		var randNum = Math.random() * (35 - 28) + 28;
    		var curDate = parseInt(moment().format('x'));
    		$scope.monitorize[2].locations[0].data.push([curDate, randNum]);
    		console.log("Added "+randNum+"");
    	}

    	$scope.monitorize = [
    		{
    			'key':'light',
    			'value': 'Luz',
    			'color': 'yellow',
    			'suffix': 'lux',
    			'locations': [
    				{
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b81703','b0b448b85586']
    				},
    				{
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b84887']
    				}
    			],
    			'mqtt':'quasar/datum#lux',
    			'datum':'lux'
    		},
    		{
    			'key':'temperature',
    			'value': 'Temperatura',
    			'color': 'magenta',
    			'suffix': '˚C',
    			'locations': [
    				{
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b81703','b0b448b85586']
    				},
    				{
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b84887']
    				}
    			],
    			'mqtt':'quasar/datum#ambient_temperature',
    			'datum':'ambient_temperature'
    		},
    		{
    			'key':'humidity',
    			'value': 'Humedad',
    			'color': 'blue',
    			'suffix': '%',
    			'locations': [
    				{
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b84887','b0b448b85586']
    				},
    				{
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b81703']
    				}
    			],
    			'mqtt':'quasar/datum#humidity',
    			'datum':'humidity'
    		},
    		{
    			'key':'volume',
    			'value': 'Volumen',
    			'color': 'white',
    			'suffix': 'db',
    			'locations': [
    				{
    					'name': 'PATIO DE COLUMNAS',
    					'generic':['volume']
    				}
    			],
    			'mqtt':'quasar/volume',
    			'datum':'volume'
    		}

    	];


    	$scope.xFunction = function(){
			return function(d){
				return d[0];
			};
		};
		$scope.yFunction = function(){
			return function(d){
				return d[1];
			};
		};

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
    			console.log($scope.monitorize);
    		}
    	}

    	$scope.loadDeviceData = function(device){
    		quasarApi.getSensorData(device.device).then(function(response){

    			for(var i=0; i<$scope.monitorize.length; i++){
    				var monitor_group = $scope.monitorize[i];

    				for(var y=0; y<monitor_group.locations.length; y++){
    					if(monitor_group.locations[y].devices){
	    					if(monitor_group.locations[y].devices.indexOf(device.device) >= 0){
	    						if(monitor_group.locations[y].data === undefined){
	    							monitor_group.locations[y].data = [];
	    						}

	    						for(var x=0; x<response.data.length; x++){
	    							var metric = response.data[x];
	    							var date = parseInt(moment(metric.date).format('x'));  // jshint ignore:line
	    							if(monitor_group.datum && metric[monitor_group.datum]){
			    						monitor_group.locations[y].data.push([date, metric[monitor_group.datum]]);
			    					}
		    					}

		    					monitor_group.locations[y].data.sort(function(a,b){ return a[0]-b[0]; });
	    					}
	    				}
    				}

    			}
    			
    			//startListening();
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

	    		/*
				$scope.mqttClient.on('message', function (topic, message) {
					//console.log(topic);
					//console.log(message);
					//console.log('--------');
				});*/
			}
    	}
	
  }]);
