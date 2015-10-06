'use strict';

describe('Controller: ApihourCtrl', function () {

  // load the controller's module
  beforeEach(module('quasarFrontendApp'));

  var ApihourCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ApihourCtrl = $controller('ApihourCtrl', {
      $scope: scope
    });
  }));

  it('should inject mqtt data into data pool', function(){

    var testDatum = {
      'ambient_temperature': 25.1,
      'device': 'C5E',
      'humidity': 26.2,
      'lux': 27.3,
      'object_temperature': 28.4,
      'pressure': 29.5,
      'temperature': -30.6
    };

    var testVolume = {
      'volume': -21.3545
    };

    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatum));
    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume));
    expect(scope.dataPool.length).toBe(2);
  });

  it('should ignore mqtt topics that are not handled', function(){
    var testVolume = {
      'volume': -21.3545
    };

    scope.manageMqttMessage('quasar/notSupported', angular.toJson(testVolume));
    expect(scope.dataPool.length).toBe(0);
  })

  it('should inject into data pool topic the device id after # if mqtt datum', function(){

    var testDatum = {
      'ambient_temperature': 25.1,
      'device': 'ABC',
      'humidity': 26.2,
      'lux': 27.3,
      'object_temperature': 28.4,
      'pressure': 29.5,
      'temperature': -30.6
    };

    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatum));
    
    expect(scope.dataPool[0].mqtt_topic.indexOf('#') >= 0).toBeTruthy();  
      

  });

  it('should inject the same topics grouped into the data pool', function(){
    var testVolume1 = {
      'volume': -21.3545
    };

    var testVolume2 = {
      'volume': -21.3545
    };

    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume1));
    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume2));
    
    expect(scope.dataPool.length).toBe(1);
    expect(scope.dataPool[0].mqtt_object.length).toBe(2);  

  });

  it('should push data from the pool to the monitor variable', function(){

    scope.monitorizeData = [
      {
        'key':'monitor1',
        'locations': [
          {
            'key':'device1',
            'devices':['dev1']
          },
          {
            'key':'device1-2',
            'devices':['dev1', 'dev2']
          },
          {
            'key':'device3',
            'devices':['dev3']
          }
        ],
        'mqtt':'quasar/datum',
        'datum':'lux'
      },
      {
        'key':'monitor2',
        'locations': [
          {
            'key':'device1',
            'devices':['dev1']
          },
          {
            'key':'device1-2',
            'devices':['dev1', 'dev2']
          },
          {
            'key':'device3',
            'devices':['dev3']
          }
        ],
        'mqtt':'quasar/datum',
        'datum':'ambient_temperature'
      },
      {
        'key':'monitor3',
        'locations': [
          {
            'key':'device1',
            'devices':['dev1']
          },
          {
            'key':'device1-2',
            'devices':['dev1', 'dev2']
          },
          {
            'key':'device3',
            'devices':['dev3']
          }
        ],
        'mqtt':'quasar/datum',
        'datum':'humidity'
      },
      {
        'key':'monitor4',
        'locations': [
          {
            'key':'genVolume',
            'name': 'genVolume',
            'generic':['volume']
          }
        ],
        'mqtt':'quasar/volume',
        'datum':'volume'
      }
    ];

    var testVolume1 = {
      'volume': 4
    };

    var testVolume2 = {
      'volume': 10
    };

    var testVolume3 = {
      'volume': 13
    };
    //Volume avg = 9
    var volumeAvg = (testVolume1.volume + testVolume2.volume + testVolume3.volume)/3;


    //Device 1
    var testDatumDevice1D1 = {
      'device': 'dev1',
      'humidity': 10,
      'ambient_temperature': 15,
      'lux': 24.3
    };
    var testDatumDevice1D2 = {
      'device': 'dev1',
      'humidity': 20,
      'ambient_temperature': 13,
      'lux': 27.3
    };

    //Avg h:15 a:14 l:25.8
    var d1Avg = {
      'humidity': (testDatumDevice1D1.humidity+testDatumDevice1D2.humidity)/2,
      'ambient_temperature': (testDatumDevice1D1.ambient_temperature+testDatumDevice1D2.ambient_temperature)/2,
      'lux': (testDatumDevice1D1.lux+testDatumDevice1D2.lux)/2
    }

    //Device 2
    var testDatumDevice2D1 = {
      'device': 'dev2',
      'humidity': 26.2,
      'ambient_temperature': 25.1,
      'lux': 27.3
    };
    //Avg h:26.2 a:25.1 l:27.3
    var d2Avg = {
      'humidity': (testDatumDevice2D1.humidity)/1,
      'ambient_temperature': (testDatumDevice2D1.ambient_temperature)/1,
      'lux': (testDatumDevice2D1.lux)/1
    }

    //Device 3
    var testDatumDevice3D1 = {
      'device': 'dev3',
      'humidity': 8,
      'ambient_temperature': 25.1,
      'lux': 127.3
    };
    var testDatumDevice3D2 = {
      'device': 'dev3',
      'humidity': 11,
      'ambient_temperature': 32.1,
      'lux': 167.5
    };
    var testDatumDevice3D3 = {
      'device': 'dev3',
      'humidity': 8,
      'ambient_temperature': 28.3,
      'lux': 217.4
    };
    //Avg h:9 a:28.5 l:170.73
    var d3Avg = {
      'humidity': (testDatumDevice3D1.humidity+testDatumDevice3D2.humidity+testDatumDevice3D3.humidity)/3,
      'ambient_temperature': (testDatumDevice3D1.ambient_temperature+testDatumDevice3D2.ambient_temperature+testDatumDevice3D3.ambient_temperature)/3,
      'lux': Math.round(((testDatumDevice3D1.lux+testDatumDevice3D2.lux+testDatumDevice3D3.lux)/3)*100)/100
    }

    var deviceAvg = {
      'dev1':d1Avg,
      'dev2':d2Avg,
      'dev3':d3Avg
    }

    //Sets the volume
    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume1));
    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume2));
    scope.manageMqttMessage('quasar/volume', angular.toJson(testVolume3));

    //sets the datum
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice1D1));
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice1D2));
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice2D1));
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice3D1));
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice3D2));
    scope.manageMqttMessage('quasar/datum', angular.toJson(testDatumDevice3D3));

    //pushes the data pool
    scope.pushDataPool();

    //Validates the data in the monitor entry 1-3
    for(var i=0; i<scope.monitorizeData.length-1; i++){
      var monitor = scope.monitorizeData[i];
      
      for(var y=0; y<monitor.locations.length; y++){
        var loc = monitor.locations[y];
        if(y!=1){

          expect(loc.data[0][1]).toBe(deviceAvg[loc.devices[0]][monitor.datum]);
        }else{
          expect(loc.data[0][1]).toBe(deviceAvg[loc.devices[0]][monitor.datum]);
          expect(loc.data[1][1]).toBe(deviceAvg[loc.devices[1]][monitor.datum]);
        }
      }
    }
    
    //Validates the volume in the monitor entry 4
    //Expects only one single line of data entry
    expect(scope.monitorizeData[3].locations[0].data.length).toBe(1);
    //Expects that the data value matches the avg
    expect(scope.monitorizeData[3].locations[0].data[0][1]).toBe(volumeAvg);
    


  });  

  
});
