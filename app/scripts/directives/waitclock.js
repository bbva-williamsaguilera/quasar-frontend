'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:waitClock
 * @description
 * # waitClock
 */
angular.module('quasarFrontendApp')
  .directive('waitClock', ['$window', '$timeout', 'd3Service', 
  function($window, $timeout, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        time: '=',
        label: '@',
        onClick: '&'
      },
      link: function(scope, ele, attrs) {
        d3Service.d3().then(function(d3) {

          //Numero de separaciones del reloj
          var totalSecciones = 60;

          //Atributo de valor actual
          var actualValue = scope.time;
          if(actualValue.indexOf(':') < 0){
            actualValue = ['0','0'];
          }else{
            actualValue = actualValue.split(':');
          }

          var actualPercentage = (actualValue[0]*100)/totalSecciones;


          var gaugeColor = ['#9BC741','#EDBC3E','#EDBC3E','#AB1D5D'];
          
          var currentColor = gaugeColor[Math.floor((actualPercentage*gaugeColor.length)/100)];

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
            scope.updateActual(scope.time);
          });
          
          //Vuelve a renderizar la gráfica en caso de cambios en la data
          scope.$watch('time', function(newActual) {
            scope.updateActual(newActual);
          }, true);


          function centerTranslation() {
            return 'translate('+totalWidth/2 +','+ totalHeight/2 +')';
          }

          
          svg.append('g')
            .attr('id', 'clock-container')
            .attr('transform', centerTranslation());

          


          function deg2rad(deg) {
            return ((deg) * Math.PI / 180);
          }

          var radius = totalWidth/2;
          if(totalWidth > totalHeight){
            radius = totalHeight/2;
          }

          var arc = d3.svg.arc()
            .innerRadius(radius-20)
            .outerRadius(radius-5)
            .startAngle(deg2rad(0))
            .endAngle(function(d){
              //console.log(d);
              var deg = (d*360)/100;
              deg = Math.floor(deg);
              //console.log(deg);
              return deg2rad(deg);
            });

          svg.select('#clock-container')
            .append('circle')
              .attr('fill', '#3E3E3D')
              .attr('r', radius-5)
              .attr('cx', 0)
              .attr('cy', 0)

          svg.select('#clock-container')
            .append('circle')
              .attr('id', 'cover-circle')
              .attr('fill', '#000')
              .attr('stroke', currentColor)
              .attr('stroke-width', '1px')
              .attr('r', radius-20)
              .attr('cx', 0)
              .attr('cy', 0);

          svg.select('#clock-container')
            .append('text')
              .attr('id','min-placeholder')
              .text('min')
              .attr('fill', '#FFF')
              .attr('y',-3)
              .attr('x', 10)
              .style('font-size','14px');

          

          svg.select('#clock-container')
            .append('text')
              .attr('id','seg-placeholder')
              .text('seg')
              .attr('fill', '#FFF')
              .attr('y',17)
              .attr('x', 10)
              .style('font-size','14px');

          svg.select('#clock-container')
            .append('g')
            .attr('data-direction','down')
            .attr('id', 'arrow-container');

          svg.select('#arrow-container')
            .append('path')
              .attr('d', 'M0,0H10L5,8L0,0')
              .attr('stroke', 'transparent')
              .attr('fill', '#AEAEAE')
              .attr('transform','translate(-36,7)')
              .attr('x', -30);

          svg.select('#arrow-container')
            .append('path')
              .attr('d', 'M0,0H10L5,8L0,0')
              .attr('stroke', 'transparent')
              .attr('fill', '#848484')
              .attr('transform','translate(-36,-5)')
              .attr('x', -30);

          svg.select('#arrow-container')
            .append('path')
              .attr('d', 'M0,0H10L5,8L0,0')
              .attr('stroke', 'transparent')
              .attr('fill', '#222221')
              .attr('transform','translate(-36,-17)')
              .attr('x', -30);

          svg.select('#clock-container')
              .append('text')
                .attr('id','sec')
                .text(actualValue[1])
                .attr('fill', '#FFF')
                .attr('y',17)
                .attr('x', -20)
                .style('font-size','22px')
                .style('font-weight', 'bold');

            svg.select('#clock-container')
              .append('text')
                .attr('id','min')
                .text(actualValue[0])
                .attr('fill', '#FFF')
                .attr('y',-3)
                .attr('x', -20)
                .style('font-size','22px')
                .style('font-weight', 'bold');

            svg.select('#clock-container')
              .append('text')
                .attr('id','closed')
                .text('')
                .attr('fill', '#FFF')
                .attr('y',9)
                .attr('x', -37)
                .style('font-size','22px')
                .style('font-weight', 'bold');
          

          //Actualiza la gráfica y los textos asociados
          scope.updateActual = function(valorActual) {
            //Si no hay parametros no continúa
            if (!valorActual) {
                return;
            }

            if(valorActual != 'closed'){
              //Atributo de valor actual
              var actualValue;
              if(valorActual.indexOf(':') < 0){
                actualValue = ['0','0'];
              }else{
                actualValue = valorActual.split(':');
              }

              var actualPercentage = (actualValue[0]*100)/totalSecciones;
              var currentColor = gaugeColor[Math.floor((actualPercentage*gaugeColor.length)/100)];

              var oldValue = parseInt(svg.select('#min').text());
              var mov = 'down';
              if(oldValue < actualValue[0]){
                mov = 'up'
              };

              svg.select('#min').text(actualValue[0]);
              svg.select('#closed').text('');
              svg.select('#min-placeholder').text('min');
              svg.select('#sec').text(actualValue[1]);
              svg.select('#seg-placeholder').text('seg');
              svg.select('#arrow-container').style('display', 'block');
              if(svg.select('#arrow-container').attr('data-direction') != mov){
                svg.select('#arrow-container').attr('data-direction',mov);
                if(mov == 'down'){
                  svg.select('#arrow-container').attr('transform', 'rotate(0 -30 0)');
                }else{
                  svg.select('#arrow-container').attr('transform', 'rotate(180 -30 0)');
                }
                
              }

              svg.select('#gauge-arc').remove();

              svg.select('#cover-circle').attr('stroke',currentColor);

              svg.select('#clock-container').append('path')
                .attr('fill', currentColor)
                .attr('id', 'gauge-arc')
                .data([actualPercentage])
                .attr('d', arc);
            }else{
              svg.select('#closed').text('Closed');
              svg.select('#sec').text('');
              svg.select('#min').text('');
              svg.select('#min-placeholder').text('');
              svg.select('#seg-placeholder').text('');
              svg.select('#arrow-container').style('display', 'none');

              svg.select('#gauge-arc').remove();
              svg.select('#clock-container').append('path')
                .attr('fill', currentColor)
                .attr('id', 'gauge-arc')
                .data([0])
                .attr('d', arc);
            }

          };
        });
      }};
}]);




















