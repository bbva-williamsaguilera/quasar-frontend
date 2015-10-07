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
        $scope.testHoursToAdd = 0;
        $scope.hour = moment().add($scope.testHoursToAdd,'hours').format('HH:mm');
        $scope.cDay = moment().format('D MMM');
        $scope.schedule = [];
        $scope.currentTalks = [];

        $scope.hoursToMonitorize = 4; //Total de horas que se van a monitorizar en el dashboard
        $scope.lastMonitorizedMoment = moment().add($scope.testHoursToAdd, 'hours').subtract($scope.hoursToMonitorize, 'hours');

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
        $scope.tweetData = [
            {
                'title': '#theAPIHourIoT',
                'data' : [
                    { 
                        'tag':'Yesterday',
                        'value':27,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Today',
                        'value':48,
                        'color': '#9BC741'
                    }
                ] 
            },
            {
                'title': '@theapihour',
                'data' : [
                    { 
                        'tag':'Yesterday',
                        'value':1,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Today',
                        'value':50,
                        'color': '#9BC741'
                    }
                ] 
            }

        ];


        $scope.wifiData = [
            {
                'title': '',
                'data' : [
                    { 
                        'tag':'Friday',
                        'value':223,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Saturday',
                        'value':38,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Sunday',
                        'value':27,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Monday',
                        'value':245,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Tuesday',
                        'value':238,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'Wednesday',
                        'value':205,
                        'color': '#3E3E3D'
                    },
                    { 
                        'tag':'API Hour',
                        'value':650,
                        'color': '#9BC741'
                    }
                ] 
            }

        ];

        $scope.metrics = {
            'costeElectrico':[50,60,70,20,60,20,30,70,50,30,60,30],
            'esperaCafeteria':'5:23',
            'asistentes': {
                'total':150,
                'actual':112
            },
            'ocupacion':{
                'planta1':10,
                'planta2':8,
                'planta3':5
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
                'entradas':20,
                'salidas':5
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
            quasarApi.getScheduleData().then(function(response){
                $scope.schedule = response.data;
                $scope.schedule.sort(function(a,b){ 
                    var aHour = a.hour.split(':');
                    var bHour = b.hour.split(':');

                    if(aHour[0] == bHour[0]){
                        return aHour[1]-bHour[1];
                    }

                    return aHour[0]-bHour[0];
                });
                angular.forEach($scope.schedule, function(talk, key){
                    talk.endHour = talk.hour;
                    if(key < $scope.schedule.length-1){
                        if($scope.schedule[key+1]){
                            talk.endHour = $scope.schedule[key+1].hour;
                        }
                    }
                    if(talk.speaker){
                        quasarApi.getGenericData('speaker',talk.speaker).then(function(response){
                            talk.speaker = response.data;
                        }, function(error){
                            console.log('Fallo al cargar ponente del evento '+talk.talk+ ' '+error);
                        });
                    }
                });
                console.log($scope.schedule);
                $scope.loadState.schedule = true;
                $scope.loadCurrentTalks();

            }, function(error){
                console.log('Fallo al cargar el programa del evento '+error);
            });
        }

        //Funcion a ejecutarse cada minuto
        $scope.talkEnd = undefined;
        $scope.tick = function(){
            $scope.hour = moment().add($scope.testHoursToAdd, 'hours').format('HH:mm');
            $scope.lastMonitorizedMoment = moment().add($scope.testHoursToAdd, 'hours').subtract($scope.hoursToMonitorize, 'hours');

            $scope.loadCurrentTalks();
            $scope.cleanMonitorData();

            $scope.randomizeData();
            
        };
        $interval($scope.tick, 6000);

        $scope.randomCounter = 0;
        $scope.randomizeData = function(){
            
            if($scope.randomCounter >= 3){
                
                $scope.randomCounter = 0;

                //randoms true or false de los baños
                $scope.metrics.detalleOcupacion[0].ocupacion['bano-mujer-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['bano-mujer-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['bano-hombre-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['bano-hombre-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['bano-minus'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['tower2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[0].ocupacion['coconut2'] = !(Math.random()+.5|0);

                $scope.metrics.detalleOcupacion[1].ocupacion['bano-mujer-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['bano-mujer-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['bano-hombre-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['bano-hombre-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['bano-minus'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['tower1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[1].ocupacion['coconut1'] = !(Math.random()+.5|0);

                $scope.metrics.detalleOcupacion[2].ocupacion['bano-mujer-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[2].ocupacion['bano-mujer-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[2].ocupacion['creative-room'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[2].ocupacion['war-room'] = !(Math.random()+.5|0);

                $scope.metrics.detalleOcupacion[3].ocupacion['bano-mujer-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[3].ocupacion['bano-mujer-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[3].ocupacion['bano-hombre-1'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[3].ocupacion['bano-hombre-2'] = !(Math.random()+.5|0);
                $scope.metrics.detalleOcupacion[3].ocupacion['bano-minus'] = !(Math.random()+.5|0);

                $scope.checkAvailability();

                randomizeEntradasSalidas();


   
            }

            //random del numero de ocupacion por planta
            $scope.metrics.ocupacion.planta1 = randomOcupacionInTime($scope.metrics.ocupacion.planta1,1,5);
            $scope.metrics.ocupacion.planta2 = randomOcupacionInTime($scope.metrics.ocupacion.planta2,1,5);
            $scope.metrics.ocupacion.planta3 = randomOcupacionInTime($scope.metrics.ocupacion.planta3,1,5);


            $scope.randomCounter++;
        };

        function randomizeEntradasSalidas(){
            var horaActual = $scope.hour.split(':')[0];



        }

        function randomOcupacionInTime(valActual,min,max){
            var horaActual = $scope.hour.split(':')[0];

            var dataVal = [
                //Formato [horaDeInicio, horaDeFin, minPorcentaje, maxPorcentaje]
                [9,12,81,92],
                [13,14,28,32],
                [15,17,67,83],
                [18,18,25,43],
                [19,21,11,18]
            ];
            var porcentaje = [];
            for(var i=0; i<dataVal.length; i++){
                
                if(horaActual >= dataVal[i][0] && horaActual <= dataVal[i][1]){
                    porcentaje[0] = dataVal[i][2];
                    porcentaje[1] = dataVal[i][3];
                    break;
                }
            }
            
            if(valActual <= porcentaje[0]){
                valActual = parseFloat(valActual) + Math.random() * (max - min) + min;
            }else{
                if(valActual >= porcentaje[1]){
                   valActual = parseFloat(valActual) - Math.random() * (max - min) + min; 
                }else{
                    valActual = parseFloat(valActual) + Math.random() * (max - (-max)) + (-max);
                }
            }

            return Math.round(valActual);


        }

        //Carga las ponencias que se están llevando a cabo dentro de la ventana de monitorización
        $scope.loadCurrentTalks = function(){
            if($scope.loadState.schedule == true){

                $scope.currentTalks = [];
                var currentTime = $scope.hour.split(':');
                currentTime = moment().hour(currentTime[0]).minute(currentTime[1]);

                var currentLapse = moment(currentTime).format('x') - moment($scope.lastMonitorizedMoment).format('x');

                angular.forEach($scope.schedule, function (talk, key){
                    var talkTime = talk.hour.split(':');
                    
                    var talkHour = moment().hour(talkTime[0]).minute(talkTime[1]);
                    var periodStart = $scope.lastMonitorizedMoment;
                    
                    if(moment(talkHour).isBetween(periodStart,currentTime)){



                        var talkMinus = moment(talkHour).format('x') - moment($scope.lastMonitorizedMoment).format('x');
                        var talkPosition = (talkMinus * 95) / currentLapse;
                        
                        talk.relativePosition = Math.round(talkPosition*100)/100;
                        talk.position = key;

                        switch(talk.talk){
                            case 'COFFEE BREAK':
                                talk.image = 'images/lecture-coffee.png';
                                break;
                            case 'LUNCH & NETWORKING':
                                talk.image = 'images/lecture-lunch.png';
                                break;
                            case 'MESA REDONDA: IoT dónde estamos y hacia dónde vamos':
                                talk.image = 'images/lecture-mesa.png';
                                break;
                            case 'Recepción y acreditaciones':
                                talk.image = 'images/lecture-entrada.png';
                                break;
                            default:
                                talk.image = 'images/lecture-mesa.png';
                        }

                        $scope.currentTalks.push(talk);
                        //console.log(talk);
                    }
                });

                //SORT currentTalksArray by relativePosition
                $scope.currentTalks.sort(function(a,b){ return a.relativePosition - b.relativePosition; });

                $scope.talkEnd = $scope.schedule[$scope.currentTalks[$scope.currentTalks.length-1].position + 1].hour;
                
            }
        }

        //Descarta los datos que sean mas viejos que el periodo a monitorizar
        $scope.cleanMonitorData = function(){
            if($scope.monitorizeData.length > 0){
                var initialTime = moment().add($scope.testHoursToAdd, 'hours').subtract($scope.hoursToMonitorize+2, 'hours').format('x');
                for(var i=0; i<$scope.monitorizeData.length; i++){
                    for(var y=0; y<$scope.monitorizeData[i].locations.length; y++){
                        var loc = $scope.monitorizeData[i].locations[y];
                        if(loc.data && loc.data.length > 0){
                            var cnt = 0;
                            for(var x=0; x<loc.data.length; x++){
                                if(loc.data[x][0] >= initialTime){
                                    break;
                                }else{
                                    cnt++;
                                }
                            }
                            loc.data.splice(0,cnt);
                        }
                    }
                }
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
                startListening();
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
            quasarApi.getGenericVolumeData(generic.key).then(function(response){

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
            if(arrTopic[0] == 'quasar'){
                switch(arrTopic[arrTopic.length-1]){
                    case 'volume':
                    case 'datum':
                        pushDataValue(topic, arrTopic[arrTopic.length-1], angular.fromJson(message.toString()));
                    break;
                    case 'tweet':
                        $scope.tweetData[1].data[1].value = parseInt($scope.tweetData[1].data[1].value)+1;
                    break;
                    case 'hashtag':
                        $scope.tweetData[0].data[1].value = parseInt($scope.tweetData[0].data[1].value)+1;
                    break;
                    default:
                        if(arrTopic[1] == 'metrics'){
                            switch(arrTopic[2]){
                                case 'cafeteria':
                                    $scope.metrics.esperaCafeteria = message.toString();
                                break;
                                case 'ocupacion':
                                    $scope.metrics.ocupacion.planta1 = message.toString();
                                break;
                                case 'asistentes':
                                    $scope.metrics.asistentes.actual = message.toString();     
                                break;
                                case 'bano-mujer-1':
                                case 'bano-mujer-2':
                                case 'bano-hombre-1':
                                case 'bano-hombre-2':
                                case 'bano-minus':
                                    var bano = false;
                                    if(message.toString()=='true'){
                                        bano = true;
                                    }
                                    $scope.metrics.detalleOcupacion[3].ocupacion[arrTopic[2]] = bano;
                                    $scope.checkAvailability();
                                break;

                            }
                        }
                    break;

                }
            }
    		
    	};

        //devuelve el width de un elemento entre 2 horas con la hora actual
        $scope.getCurrentTimeWidth = function(startHour, endHour){
            if(startHour != undefined && endHour != undefined){
                var currentHour = $scope.hour.split(':');
                startHour = startHour.split(':');
                endHour = endHour.split(':');

                currentHour = moment().hour(currentHour[0]).minute(currentHour[1]).format('x');
                startHour = moment().hour(startHour[0]).minute(startHour[1]).format('x');
                endHour = moment().hour(endHour[0]).minute(endHour[1]).format('x');

                var lapse = endHour - startHour;
                var currentHour = currentHour-startHour;
                return Math.round((currentHour*100)/lapse);
            }else{
                return 0;
            }
            
        };
	
  }]);


/*
  Entrada "b0b448b84c06","b0b448b86c02"
  Auditorio "b0b448b81703","b0b448b85586"
  Patio "b0b448b83b86","c4be84717f88","b0b448b81307","b0b448b85287"
*/
