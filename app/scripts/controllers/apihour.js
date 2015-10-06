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
        $scope.dataPushTimer = 2000; //Milisegundos a esperar para hacer el push de la data a los gráficos
        $scope.hour = moment().format('HH:mm');
        $scope.cDay = moment().format('D MMM');
        $scope.schedule = [];
        $scope.currentTalks = [];

        $scope.hoursToMonitorize = 5; //Total de horas que se van a monitorizar en el dashboard
        $scope.lastMonitorizedMoment = moment().subtract($scope.hoursToMonitorize, 'hours');

        //Variables de control de carga
        $scope.loadState = {
            'locations': false,
    		'devices': false,
            'initialGenerics': false,
    		'initialData': false,
    		'mqttConnection': false,
            'dataDevices': 0,
            'dataGenerics': 0,
            'schedule':false
    	};

        //Distintas metricas
        $scope.metrics = {
            'asistentes': {
                'total':150,
                'actual':112
            },
            'ocupacion':{
                'planta1':29,
                'planta2':62,
                'planta3':90
            },
            /*'disponibilidad':{
                'mujer':[0,7],
                'hombre':[5,7],
                'minus':[1,3],
                'salas':[4,6]
            },*/
            'detalleOcupacion':[
                {
                    'nombre':'planta3',
                    'ocupacion':{
                        'bano-mujer-1':false,
                        'bano-hombre-1':true,
                        'bano-mujer-2':false,
                        'bano-hombre-2':true,
                        'bano-minus':true,
                        'tower2':true,
                        'coconut2':false
                    }
                },
                {
                    'nombre':'planta2',
                    'ocupacion':{
                        'bano-mujer-1':false,
                        'bano-hombre-1':true,
                        'bano-mujer-2':false,
                        'bano-hombre-2':true,
                        'bano-minus':false,
                        'tower1':false,
                        'coconut1':true 
                    } 
                },
                {
                    'nombre':'entreplanta',
                    'ocupacion':{
                        'bano-mujer':false,
                        'bano-hombre':true,
                        'creative-room':true,
                        'war-room':true
                    }
                },
                {
                    'nombre':'planta1',
                    'ocupacion':{
                        'bano-mujer-1':false,
                        'bano-hombre-1':true,
                        'bano-mujer-2':false,
                        'bano-hombre-2':true,
                        'bano-minus':true,
                    }
                }
            ],
            
            'edificio':{
                'entradas':1890,
                'salidas':1413
            }
        }

        //Establece la disponibilidad de acuerdo con la ocupacion
        $scope.checkAvailability = function(){
            var available = {};
            for(var i=0; i<$scope.metrics.detalleOcupacion.length; i++){
                var planta = $scope.metrics.detalleOcupacion[i];
                for(var y=0; y<Object.keys(planta.ocupacion).length; y++){
                    var loc = Object.keys(planta.ocupacion)[y];
                    var tipo = '';

                    if(loc.substring(0, loc.indexOf('-'))=='bano'){
                        tipo = loc.substring(loc.indexOf('-')+1);
                        if(tipo.indexOf('-')>=0){
                            tipo = tipo.substring(0,tipo.indexOf('-'));
                        }
                    }else{
                        tipo = 'salas';
                    }

                    if(Object.keys(available).indexOf(tipo) <0){
                        available[tipo] = [0,0];
                    }
                    available[tipo][1]++;
                    if(planta.ocupacion[loc] == true){
                        available[tipo][0]++;
                    }

                    //console.log(loc.substring(0, loc.indexOf('-')), planta.ocupacion[Object.keys(planta.ocupacion)[y]]);
                }
            }
            $scope.metrics.disponibilidad = available;
        };
        $scope.checkAvailability();


        //Si no se han cargado las locaciones las trae desde el archivo externo JSON
        if($scope.loadState.locations != true){
            $http.get('misc/locations.json').then(function(res){
                $scope.monitorize = res.data; 
                $scope.loadState.locations = true; 
                //Comienza la carga de datos 
                startLoad();  
            });
        }

        //Si no se ha cargado el schedule, cargarlo
        if($scope.loadState.schedule != true){
            quasarApi.getGenericData('schedule').then(function(response){
                $scope.schedule = response.data;
                angular.forEach($scope.schedule, function(talk){
                    if(talk.speaker){
                        quasarApi.getGenericData('speaker',talk.speaker).then(function(response){
                            talk.speaker = response.data;
                        }, function(error){
                            console.log('Fallo al cargar ponente del evento '+talk.talk+ ' '+error);
                        });
                    }
                });
                $scope.loadState.schedule = true;

            }, function(error){
                console.log('Fallo al cargar el programa del evento '+error);
            });
        }

        //Funcion a ejecutarse cada minuto
        $scope.tick = function(){
            $scope.hour = moment().format('HH:mm');
            $scope.lastMonitorizedMoment = moment().subtract($scope.hoursToMonitorize, 'hours');

            $scope.loadCurrentTalks();
            

        };
        $interval($scope.tick, 60000);

        //Carga las ponencias que se están llevando a cabo dentro de la ventana de monitorización
        $scope.loadCurrentTalks = function(){
            if($scope.loadState.schedule == true){
                $scope.currentTalks = [];
                var currentTime = $scope.hour.split(':');
                currentTime = moment().hour(currentTime[0]).minute(currentTime[1]);

                var currentLapse = moment(currentTime).format('x') - moment($scope.lastMonitorizedMoment).format('x');

                angular.forEach($scope.schedule, function (talk){
                    var talkTime = talk.hour.split(':');
                    
                    var talkHour = moment().hour(talkTime[0]).minute(talkTime[1]);
                    var periodStart = $scope.lastMonitorizedMoment;
                    
                    if(moment(talkHour).isBetween(periodStart,currentTime)){



                        var talkMinus = moment(talkHour).format('x') - moment($scope.lastMonitorizedMoment).format('x');
                        var talkPosition = (talkMinus * 90) / currentLapse;
                        console.log(talkHour, $scope.lastMonitorizedMoment, talkMinus, currentLapse);

                        talk.relativePosition = Math.round(talkPosition*100)/100;

                        $scope.currentTalks.push(talk);
                        console.log(talk);
                    }
                });
            }
        }

        //Establece los campos genéricos que se van a utilizar
        $scope.genericLoad = [
            {
               'key':'volume' 
            }
        ];

        //Comienza la carga de devices y generics
        function startLoad(){
            if($scope.loadState.locations != false){
                loadDevices();
                loadGenericInitial();
            }
        }

        //Si ha terminado de cargar devices y generics, carga la data a la variable monitorizeData
        // ... y comienza la escucha de MQTT
        function hasFinishedLoading(){
            
            if($scope.loadState.dataGenerics >= $scope.genericLoad.length && 
                $scope.loadState.dataDevices >= $scope.devices.length){

                $scope.monitorizeData = angular.copy($scope.monitorize);
                //startListening();
            }
        }

        //Carga la data inicial de los campos genericos
        function loadGenericInitial(){
            if($scope.loadState.initialGenerics != true){
                for(var i=0; i<$scope.genericLoad.length; i++){
                    $scope.loadGenericData($scope.genericLoad[i]);
                }
            }
        }

        //Carga los devices desde la API
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

        //Carga la data inicial de todos los devices
    	function loadInitialData(){
    		if($scope.loadState.initialData != true){
                for(var i=0; i<$scope.devices.length; i++){
    				$scope.loadDeviceData($scope.devices[i]);
    			}
    		}
    	}

        //Carga la data generica de los campos desde la API y la guarda en la variable monitorize
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
                                    var date = parseInt(moment(metric.date).format('x')); 
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

        //Carga la data de los devices desde la API y la guarda en la variable monitorize
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
	    							var date = parseInt(moment(metric.date).format('x'));  
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
    	
        //Comienza la escucha del servidor MQTT
        //TODO separarlo a un nuevo modulo
    	function startListening(){

    		if($scope.loadState.mqttConnection !== true){
    			$scope.loadState.mqttConnection = true;

	    		$scope.mqttClient = mqtt.connect('mqtt://52.18.80.55:8081');
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
					$scope.manageMqttMessage(topic, message);
				});
			}
    	}

        //Variable donde se almacenan los datos intermedios recibidos por MQTT
        $scope.dataPool = [];

        //Funcion a ser ejecutada cada X milisegundos que calcula la media de los datos recibidos
        // ... y la inserta en la variable global de datos
        $scope.pushDataPool = function(){
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
                            }else{
                                avg_object[k] = topicObject[y][k];
                            }
                        } 
                        
                    }
                    for(var key in avg_object){
                        if(!isNaN(avg_object[key])){
                            avg_object[key] = avg_object[key]/topicObject.length;
                            avg_object[key] = Math.round(avg_object[key]*100)/100;
                        }
                    }

                    //Inserta este objeto promedio en la estructura de datos
                    dataPoolCopy[i].mqtt_object = avg_object;
                    
                    for(y=0; y<$scope.monitorizeData.length; y++){
                        var monitor_group = $scope.monitorizeData[y];
                        if(dataPoolCopy[i].mqtt_topic.lastIndexOf('#') >= 0){
                            dataPoolCopy[i].mqtt_topic = dataPoolCopy[i].mqtt_topic.substring(0,dataPoolCopy[i].mqtt_topic.lastIndexOf('#'));
                        }
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
            //console.log(dataPoolCopy);
            dataPoolCopy = [];
        };
        //Intervalo para ejecutar la funcion pushDataPool cada dataPushTimer segundos
        $interval($scope.pushDataPool, $scope.dataPushTimer);

        //Guarda el resObject en la variable intermedia dataPool
        function pushDataValue(mqtt_topic, topic_var, resObject){
            var datumExists = false;

            if(Object.keys(resObject).indexOf('device') >= 0){
                mqtt_topic = mqtt_topic+'#'+resObject.device;
            }

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
        
        //Maneja la recepción de los mensajes a través de MQTT
        $scope.manageMqttMessage = function(topic, message){
            var arrTopic = topic.split('/');
            console.log(topic, message.toString());
            if(arrTopic[arrTopic.length-2] == 'quasar'){
                switch(arrTopic[arrTopic.length-1]){
                    case 'volume':
                    case 'datum':
                        pushDataValue(topic, arrTopic[arrTopic.length-1], angular.fromJson(message.toString()));
                    break;

                }
            }
    		
    	};
	
  }]);


/*
  Entrada "b0b448b84c06","b0b448b86c02"
  Auditorio "b0b448b81703","b0b448b85586"
  Patio "b0b448b83b86","c4be84717f88","b0b448b81307","b0b448b85287"
*/
