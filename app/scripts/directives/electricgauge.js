'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:electricGauge
 * @description
 * # electricGauge
 */
angular.module('quasarFrontendApp')
  .directive('electricGauge', ['$window', '$timeout', '$interval', 'd3Service', 
  function($window, $timeout, $interval, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        data: '=',
        label: '@',
        onClick: '&'
      },
      link: function(scope, ele, attrs) {
        d3Service.d3().then(function(d3) {

          //Numero de separaciones del grafico
          var totalSecciones = 12;

          //Hora de comienzo del grafico
          var horaComienzo = 9;

          //Atributo de valor actual
          var data = scope.data;
          
          scope.actualSection = moment().hour()-horaComienzo;
          if(scope.actualSection >=0 && scope.actualSection<data.length){
            var actualValue = data[scope.actualSection];
          }

          function checkSection(){

            var newSection = moment().hour()-horaComienzo;
            //var newSection = scope.actualSection+1;

            if(newSection != scope.actualSection){
              if(newSection >=0 && newSection<data.length){
                scope.actualSection = newSection;
                var actualValue = data[scope.actualSection];
              }
            }
            
          }

          $interval(checkSection, (60000)*15);

          var color = '#9BC741';
          
          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          var totalHeight = attrs.height || 100;

          //Establece el alto de grafica
          svg.attr('height', totalHeight);

          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            scope.$apply();
          };
          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.updateActual(scope.data);
          });
          
          //Vuelve a renderizar la gráfica en caso de cambios en la data
          scope.$watch('data', function(newActual) {
            scope.updateActual(newActual);
          }, true);
          scope.$watch('actualSection', function(newActual) {
            scope.updateActual(scope.data);
          }, true);


          function centerTranslation() {
            return 'translate('+totalWidth/2 +','+ totalHeight/2 +')';
          }

          
          svg.append('g')
            .attr('id', 'energy-container')
            .attr('transform', centerTranslation());

          
          function deg2rad(deg) {
            return ((deg) * Math.PI / 180);
          }

          var radius = totalWidth/2;
          if(totalWidth > totalHeight){
            radius = totalHeight/2;
          }

          
          svg.select('#energy-container')
            .append('circle')
              .attr('id', 'cover-circle')
              .attr('fill', '#000')
              .attr('stroke', color)
              .attr('stroke-width', '1px')
              .attr('r', radius-45)
              .attr('cx', 0)
              .attr('cy', 0);

          svg.append('g').attr('id','hours-container');

          var angle = deg2rad(-90);
          var step = (2*Math.PI) / totalSecciones;

          for(var i=0; i<totalSecciones; i++){
            
            var posX = Math.round((totalWidth/2)-6 + (radius-5) * Math.cos(angle));
            var posY = Math.round((totalHeight/2)+3 + (radius-5) * Math.sin(angle));
            angle += step;

            svg.select('#hours-container')
              .append('text')
                .text((horaComienzo+i)+'h')
                .attr('fill','#FFF')
                .style('font-size', '7px')
                .attr('x',posX)
                .attr('y',posY);
          }

          svg.select('#energy-container')
            .append('text')
              .text('Last hour')
              .attr('fill', '#FFF')
              .attr('y',-7)
              .attr('x', -32)
              .style('font-size','8px');

          svg.select('#energy-container')
            .append('text')
              .text('Event')
              .attr('fill', '#FFF')
              .attr('y',3)
              .attr('x', -28)
              .style('font-size','8px');

          svg.select('#energy-container')
            .append('text')
              .text('Total cost')
              .attr('fill', '#FFF')
              .attr('y',13)
              .attr('x', -29)
              .style('font-size','8px');



          svg.select('#energy-container')
            .append('text')
              .text('30 kW/h')
              .attr('id', 'last-hour-value')
              .attr('fill', '#FFF')
              .attr('y',-7)
              .attr('x', 4)
              .style('font-size','8px');

          svg.select('#energy-container')
            .append('text')
              .text('280 kW/h')
              .attr('id', 'event-value')
              .attr('fill', '#FFF')
              .attr('y',3)
              .attr('x', -4)
              .style('font-size','8px');

          svg.select('#energy-container')
            .append('text')
              .text('350 €')
              .attr('id', 'cost-value')
              .attr('fill', '#FFF')
              .attr('y',13)
              .attr('x', 10)
              .style('font-size','8px');

          
          //Funcion que aclara u oscurece un color RGB
          function shadeColor1(color, percent) {  
            var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt; // jshint ignore:line
            return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
          }

//12 sec
          var arc = d3.svg.arc()
            .innerRadius(function(d){
              var nRad = d.value * 4;
              return radius-(43)+nRad;
            })
            .outerRadius(function(d){
              var nRad = d.value * 4;
              return radius-(41)+nRad;
            })
            .startAngle(function(d){
              var deg = ((d.section)*360)/totalSecciones;
              return deg2rad(deg);
            })
            .endAngle(function(d){
              var deg = ((d.section+1)*360)/totalSecciones;
              deg = deg-2;
              return deg2rad(deg);
            });


          //Actualiza la gráfica y los textos asociados
          scope.updateActual = function(data) {
            //Si no hay parametros no continúa
            if (!data) {
                return;
            }

            var greyColor = '#6F6F6F';
            svg.selectAll('.electric-arc').remove();
            var totalEvent = 0;
            var lastHour = 0;

            if(scope.actualSection >= 0){
              for(var i=0; i<scope.actualSection; i++){
                var arcColor = greyColor;
                if(i==(scope.actualSection-1)){
                  arcColor = color;
                  lastHour = data[i];
                }
                totalEvent += data[i];

                var dataNorm = Math.round(data[i]/10);
                
                svg.select('#energy-container')
                  .append('g')
                    .attr('class', 'electric-arc')
                    .attr('id', 'arc-group-'+i);

                for(var cnt=0; cnt<dataNorm; cnt++){
                  svg.select('#arc-group-'+i)
                    .append('path')
                      .attr('fill', shadeColor1(arcColor, cnt*-5))
                      .data([{'section':i,'value':cnt}])
                      .attr('d', arc)
                }

                

              }

              svg.select('#last-hour-value').text(lastHour + ' kW/h');
              svg.select('#event-value').text(totalEvent + ' kW/h');
              svg.select('#cost-value').text(Math.round(totalEvent*0.14) + ' €');

            }


          };
        });
      }};
}]);