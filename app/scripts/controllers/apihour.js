'use strict';

/**
 * @ngdoc function
 * @name quasarFrontendApp.controller:ApihourCtrl
 * @description
 * # ApihourCtrl
 * Controller of the quasarFrontendApp
 */
angular.module('quasarFrontendApp')
  .controller('ApihourCtrl', ['$scope', 'quasarApi', '$http', '$interval', function ($scope, quasarApi, $http, $interval) {

    	$scope.devices = [];
    	$scope.mqttClient = null;
        $scope.monitorize = [];
        $scope.monitorizeData = [];
        $scope.dataPushTimer = 2000; //Milliseconds in which the date is pushed to the graphics

        $scope.loadState = {
            'locations': false,
    		'devices': false,
            'initialGenerics': false,
    		'initialData': false,
    		'mqttConnection': false,
            'dataDevices': 0,
            'dataGenerics': 0
    	};

        if($scope.loadState.locations != true){
            $http.get('misc/locations.json').then(function(res){
                $scope.monitorize = res.data; 
                $scope.loadState.locations = true;  
                startLoad();  
            });
        }

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

        function startLoad(){
            if($scope.loadState.locations != false){
                loadDevices();
                loadGenericInitial();
            }
        }

        function hasFinishedLoading(){
            
            if($scope.loadState.dataGenerics >= $scope.genericLoad.length && 
                $scope.loadState.dataDevices >= $scope.devices.length){

                $scope.monitorizeData = angular.copy($scope.monitorize);
                startListening();
            }
        }

        function loadGenericInitial(){
            if($scope.loadState.initialGenerics != true){
                for(var i=0; i<$scope.genericLoad.length; i++){
                    $scope.loadGenericData($scope.genericLoad[i]);
                }
            }
        }

    	function loadDevices(){
    		if($scope.loadState.devices != true){
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
    		if($scope.loadState.initialData != true){
                for(var i=0; i<$scope.devices.length; i++){
    				$scope.loadDeviceData($scope.devices[i]);
    			}
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


                $scope.loadState.dataGenerics++;
                hasFinishedLoading();
                
            }, function(error){
                console.log('Fallo al cargar los historicos de '+generic.key+' '+error);
            });
            
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

                $scope.loadState.dataDevices++;
                hasFinishedLoading();
    			
    			
    		}, function(error){
    			console.log('Fallo al cargar los historicos de '+device.device+' '+error);
    		});
    	};

    	

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

        $scope.dataPool = [];

        $interval(function(){
            var dataPoolCopy = angular.copy($scope.dataPool);
            $scope.dataPool = [];
            for(var i=0; i<dataPoolCopy.length; i++){
                
                var topicObject = dataPoolCopy[i].mqtt_object;

                if(topicObject.length > 0){
                    var avg_object = {};
                    for(var y=0; y<topicObject.length; y++){
                        for(var k in topicObject[y]){
                            if(!isNaN(topicObject[y][k])){
                                if(!avg_object[k]){
                                    avg_object[k] = 0;
                                }
                                avg_object[k] += parseFloat(topicObject[y][k]);
                            }
                        } 
                    }
                    for(var key in avg_object){
                        avg_object[key] = avg_object[key]/topicObject.length;
                    }

                    //Inserta este objeto promedio en la estructura de datos
                    dataPoolCopy[i].mqtt_object = avg_object;
                    console.log(avg_object);
                    
                    for(y=0; y<$scope.monitorizeData.length; y++){
                        var monitor_group = $scope.monitorizeData[y];
                        if(monitor_group.mqtt == dataPoolCopy[i].mqtt_topic){

                            if(dataPoolCopy[i].mqtt_object[monitor_group.datum]){
                                for(var x=0; x<monitor_group.locations.length; x++){
                                    var pushdata = false;
                                    if(monitor_group.locations[x].generic){
                                        if(monitor_group.locations[x].generic.indexOf(dataPoolCopy[i].topic_var) >= 0){
                                            pushdata = true;
                                        }
                                    }
                                    if(monitor_group.locations[x].devices && dataPoolCopy[i].mqtt_object.device){
                                        if(monitor_group.locations[x].devices.indexOf(dataPoolCopy[i].mqtt_object.device) >= 0){
                                            pushdata = true;
                                        }
                                    }

                                    if(monitor_group.locations[x].data === undefined){
                                        monitor_group.locations[x].data = [];
                                    }
                                    var nDate = moment().format('x');

                                    if(pushdata == true){
                                        monitor_group.locations[x].data.push([nDate, dataPoolCopy[i].mqtt_object[monitor_group.datum]]);
                                        
                                    }
                                }
                            }
                        }
                    }


                }
            }
        }, $scope.dataPushTimer);

        function pushDataValue(mqtt_topic, topic_var, resObject){
            var datumExists = false;

            for(var i=0; i<$scope.dataPool.length; i++){
                if($scope.dataPool[i].mqtt_topic == mqtt_topic){
                    datumExists = true;
                    $scope.dataPool[i].mqtt_object.push(resObject);
                }
            }

            if(!datumExists){
                var datum = {
                    'mqtt_topic':mqtt_topic,
                    'topic_var': topic_var,
                    'mqtt_object':[
                        resObject
                    ]
                };
                $scope.dataPool.push(datum);
            }
        }
        
        function manageMqttMessage(topic, message){
            var arrTopic = topic.split('/');
            if(arrTopic[arrTopic.length-2] == 'quasar'){
                switch(arrTopic[arrTopic.length-1]){
                    case 'volume':
                    case 'datum':
                        pushDataValue(topic, arrTopic[arrTopic.length-1], angular.fromJson(message.toString()));
                    break;

                }
            }
    		
    	}
	
  }]);
