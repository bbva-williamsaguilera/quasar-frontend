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
            'initialGenerics': false,
    		'initialData': false,
    		'mqttConnection': false
    	};


    	//TODO Quitar función
    	$scope.addRandomData = function(){
    		var randNum = Math.random() * (50 - 10) + 10;
    		var curDate = parseInt(moment().format('x')); // jshint ignore:line
    		$scope.monitorize[$scope.randRow].locations[$scope.randLoc].data.push([curDate, randNum]);
    		console.log('Added '+randNum);
    	};

        $scope.genericLoad = [
            {
               'key':'volume' 
            }
        ];

    	$scope.monitorize = [
    		{
    			'key':'light',
    			'value': 'Luz',
    			'color': 'yellow',
    			'suffix': ' lux',
    			'locations': [
    				{
    					'key':'entrada',
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'key':'auditorio',
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b81703','b0b448b85586']
    				},
    				{
    					'key':'patio',
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b84887']
    				}
    			],
    			'mqtt':'quasar/datum',
    			'datum':'lux'
    		},
    		{
    			'key':'temperature',
    			'value': 'Temperatura',
    			'color': 'magenta',
    			'suffix': '˚C',
    			'locations': [
    				{
    					'key':'entrada',
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'key':'auditorio',
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b81703','b0b448b85586']
    				},
    				{
    					'key':'patio',
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b84887']
    				}
    			],
    			'mqtt':'quasar/datum',
    			'datum':'ambient_temperature'
    		},
    		{
    			'key':'humidity',
    			'value': 'Humedad',
    			'color': 'blue',
    			'suffix': '%',
    			'locations': [
    				{
    					'key':'entrada',
    					'name': 'ENTRADA',
    					'devices':['b0b448b86b06']
    				},
    				{
    					'key':'auditorio',
    					'name': 'AUDITORIO',
    					'devices': ['b0b448b84887','b0b448b85586']
    				},
    				{
    					'key':'patio',
    					'name': 'PATIO DE COLUMNAS',
    					'devices': ['b0b448b81703']
    				}
    			],
    			'mqtt':'quasar/datum',
    			'datum':'humidity'
    		},
    		{
    			'key':'volume',
    			'value': 'Volumen',
    			'color': 'white',
    			'suffix': 'db',
    			'locations': [
    				{
    					'key':'patio',
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

        function startLoad(){
            loadDevices();
            loadGenericInitial();
        }

        function loadGenericInitial(){
            if($scope.loadState.initialGenerics !== true){
                for(var i=0; i<$scope.genericLoad.length; i++){
                    $scope.loadGenericData($scope.genericLoad[i]);
                }
            }
        }

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

        $scope.loadGenericData = function(generic){
            quasarApi.getGenericData(generic.key).then(function(response){

                for(var i=0; i<$scope.monitorize.length; i++){
                    var monitor_group = $scope.monitorize[i];

                    for(var y=0; y<monitor_group.locations.length; y++){
                        if(monitor_group.locations[y].generic){
                            if(monitor_group.locations[y].generic.indexOf(generic.key) >= 0){
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
                
                
            }, function(error){
                console.log('Fallo al cargar los historicos de '+generic.key+' '+error);
            });

            startListening();
        };

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
    			
    			
    		}, function(error){
    			console.log('Fallo al cargar los historicos de '+device.device+' '+error);
    		});

            startListening();
    	};

    	startLoad();

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
					manageMqttMessage(topic, message);
				});
			}
    	}

        function pushDataValue(mqtt_topic, topic_var, resObject){
            for(var i=0; i<$scope.monitorize.length; i++){
                var monitor_group = $scope.monitorize[i];
                if(monitor_group.mqtt == mqtt_topic){

                    if(resObject[monitor_group.datum]){
                        for(var y=0; y<monitor_group.locations.length; y++){
                            var pushdata = false;
                            if(monitor_group.locations[y].generic){
                                if(monitor_group.locations[y].generic.indexOf(topic_var) >= 0){
                                    pushdata = true;
                                }
                            }
                            if(monitor_group.locations[y].devices && resObject.device){
                                if(monitor_group.locations[y].devices.indexOf(resObject.device) >= 0){
                                    pushdata = true;
                                }
                            }

                            if(monitor_group.locations[y].data === undefined){
                                monitor_group.locations[y].data = [];
                            }
                            var nDate = moment().format('x');

                            if(pushdata == true){
                                //console.log('Pushed '+[nDate, resObject[monitor_group.datum]]+' to '+monitor_group.key+' in location '+monitor_group.locations[y].name);
                                //console.log(resObject);
                                monitor_group.locations[y].data.push([nDate, resObject[monitor_group.datum]]);
                            }
                        }
                    }
                }
            }
        }
        var volumeToPush = [];
    	function manageMqttMessage(topic, message){
            var arrTopic = topic.split('/');

            if(arrTopic[arrTopic.length-2] == 'quasar'){
                var nDate = moment().format('x');
                switch(arrTopic[arrTopic.length-1]){
                    case 'volume':
                        
                        if(volumeToPush.length <=4){
                            volumeToPush.push()
                        }
                        var nDate = moment().format('x');
                        pushDataValue(topic, 'volume', angular.fromJson(message.toString()));

                        //var nVol = angular.fromJson(message.toString()).volume;
                        //$scope.monitorize[3].locations[0].data.push([nDate, nVol]);

                    break;
                    case 'datum':
                        var nDate = moment().format('x');
                        pushDataValue(topic, 'datum', nDate, angular.fromJson(message.toString()));
                }
            }

    		/*if(topic == 'quasar/cafeteria'){
                console.log(message.toString());
                $scope.mqttCafeteria = message.toString();
                $scope.$apply();
            }*/
    		
    	}
	
  }]);
