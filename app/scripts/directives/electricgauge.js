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

          

          //Hora de comienzo del grafico
          var horaComienzo = parseInt(attrs.startHour) || 0;

          //Atributo de valor actual
          var data = scope.data;

          //Numero de separaciones del grafico
          var totalSecciones = data.length;
          
          scope.actualSection = moment().hour()-horaComienzo;
          /*var actualValue;
          if(scope.actualSection >=0 && scope.actualSection<data.length){
            actualValue = data[scope.actualSection];
          }*/

          function checkSection(){

            var newSection = moment().hour()-horaComienzo;
            //var newSection = scope.actualSection+1;

            if(newSection !== scope.actualSection){
              if(newSection >=0 && newSection<data.length){
                scope.actualSection = newSection;
                //actualValue = data[scope.actualSection];
              }
            }
            
          }
          if(parseInt(attrs.checkEvery)){
            $interval(checkSection, (60000)*parseInt(attrs.checkEvery));
          }

          var lastEventTag = {
            'prefix': 'Last',
            'suffix': ''
          };

          var totalEventTag = {
            'prefix': 'Total',
            'suffix': ''
          };

          var costEventTag = {
            'prefix': '',
            'suffix': '',
            'value': null
          };

          attrs.lastEventTag = angular.fromJson(attrs.lastEventTag);
          if(attrs.lastEventTag !== null && typeof attrs.lastEventTag === 'object'){
            if(attrs.lastEventTag.prefix !== undefined){
              lastEventTag.prefix = attrs.lastEventTag.prefix;
            }
            if(attrs.lastEventTag.suffix !== undefined){
              lastEventTag.suffix = attrs.lastEventTag.suffix;
            }
          }

          attrs.totalEventTag = angular.fromJson(attrs.totalEventTag);
          if(attrs.totalEventTag !== null && typeof attrs.totalEventTag === 'object'){
            if(attrs.totalEventTag.prefix !== undefined){
              totalEventTag.prefix = attrs.totalEventTag.prefix;
            }
            if(attrs.totalEventTag.suffix !== undefined){
              totalEventTag.suffix = attrs.totalEventTag.suffix;
            }
          }

          attrs.costEventTag = angular.fromJson(attrs.costEventTag);
          if(attrs.costEventTag !== null && typeof attrs.costEventTag === 'object'){
            if(attrs.costEventTag.prefix !== undefined){
              costEventTag.prefix = attrs.costEventTag.prefix;
            }
            if(attrs.costEventTag.suffix !== undefined){
              costEventTag.suffix = attrs.costEventTag.suffix;
            }
            if(attrs.costEventTag.value !== undefined && !isNaN(parseFloat(attrs.costEventTag.value))){
              costEventTag.value = attrs.costEventTag.value;
            }
          }

          var color = attrs.colorActive || '#9BC741';
          var greyColor = attrs.colorInactive || '#6F6F6F';
          
          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          if(totalWidth === undefined || totalWidth <=0){
            totalWidth = svg[0][0].offsetWidth;
          }
          var totalHeight = attrs.height || 100;

          //Establece el alto de grafica
          svg.attr('height', totalHeight);

          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            //scope.$apply();
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
          scope.$watch('actualSection', function() {
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


          /*
          svg.select('#energy-container')
            .append('text')
              .text(lastEventTag.prefix)
              .attr('fill', '#FFF')
              .attr('y',-7)
              .attr('x', -32)
              .style('font-size','8px');

          svg.select('#energy-container')
            .append('text')
              .text(totalEventTag.prefix)
              .attr('fill', '#FFF')
              .attr('y',3)
              .attr('x', -28)
              .style('font-size','8px');

          if(costEventTag.value !== null){

            svg.select('#energy-container')
              .append('text')
                .text('Total cost')
                .attr('fill', '#FFF')
                .attr('y',13)
                .attr('x', -29)
                .style('font-size','8px');
          }*/



          svg.select('#energy-container')
            .append('text')
              .text('')
              .attr('id', 'last-hour-value')
              .attr('fill', '#FFF')
              .attr('y',-7)
              .attr('x', 0)
              .style('font-size','8px')
              .attr('text-anchor', 'middle');

          svg.select('#energy-container')
            .append('text')
              .text('')
              .attr('id', 'event-value')
              .attr('fill', '#FFF')
              .attr('y',3)
              .attr('x', 0)
              .style('font-size','8px')
              .attr('text-anchor', 'middle');

          if(costEventTag.value !== null){
            svg.select('#energy-container')
              .append('text')
                .text('350 €')
                .attr('id', 'cost-value')
                .attr('fill', '#FFF')
                .attr('y',13)
                .attr('x', 0)
                .style('font-size','8px')
                .attr('text-anchor', 'middle');
          }

          
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
            var i;
            var max, min;
            for(i=0; i<data.length; i++){
              if(max === undefined || max < data[i]){
                max = data[i];
              }
              if(min === undefined || min > data[i]){
                min = data[i];
              }
            }

            var step = (max-min)/7;

            /*
            8 secciones
            20 minimo
            150 maximo

            130 diferencia
            
            20 debería ser igual a 1
            150 debería ser igual a 8

            20-20 0 minimo =1

            

            150-20 130 maximo =8 

            */

            svg.selectAll('.electric-arc').remove();
            var totalEvent = 0;
            var lastHour = 0;

            if(scope.actualSection >= 0){
              for(i=0; i<scope.actualSection; i++){
                var arcColor = greyColor;
                if( i === (scope.actualSection-1)){
                  arcColor = color;
                  lastHour = data[i];
                }
                totalEvent += data[i];

                var dataNorm = Math.ceil((data[i]-min)/step)+1;
                
                svg.select('#energy-container')
                  .append('g')
                    .attr('class', 'electric-arc')
                    .attr('id', 'arc-group-'+i);

                for(var cnt=0; cnt<dataNorm; cnt++){
                  svg.select('#arc-group-'+i)
                    .append('path')
                      .attr('fill', shadeColor1(arcColor, cnt*-5))
                      .data([{'section':i,'value':cnt}])
                      .attr('d', arc);
                }

                

              }

              svg.select('#last-hour-value').text(lastEventTag.prefix+ ' '+lastHour + ' '+lastEventTag.suffix);
              svg.select('#event-value').text(totalEventTag.prefix+ ' '+totalEvent + ' '+totalEventTag.suffix);

              if(costEventTag.value !== null && !isNaN(costEventTag.value)){
                var costValue = Math.round(totalEvent*parseFloat(costEventTag.value));
                svg.select('#cost-value').text(costEventTag.prefix+ ' '+costValue + ' '+costEventTag.suffix);
              }
              

            }


          };
        });
      }};
}]);