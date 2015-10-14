'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:dottedMatrix
 * @description
 * # dottedMatrix
 */
angular.module('quasarFrontendApp')
  .directive('dottedMatrix', ['$window', '$timeout', 'd3Service', 
  function($window, $timeout, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        actual: '=',
        total: '=',
        label: '@',
        onClick: '&'
      },
      link: function(scope, ele) {
        d3Service.d3().then(function(d3) {

          //Atributo de valor maximo
          var totalValue = scope.total;
          //Atributo de valor actual
          var actualValue = scope.actual;

          if(actualValue > totalValue){
            actualValue = totalValue;
          }

          //Porcentaje actual de circulos marcados
          var actualPercentage = (actualValue*100)/totalValue;

          //Tamaño de los puntos
          var dotSize = 6;
          var margin = 2;

          var dotColor = {
            active: '#9BC741',
            inactive: '#3E3E3D'
          };

          //Elemento SVG ajustado al 80% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '80%');

          
          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          if(totalWidth === undefined || totalWidth <=0){
            totalWidth = svg[0][0].offsetWidth;
          }
          var totalHeight = 100;
          var marginBottom = 20;

          //Establece el alto de grafica
          svg.attr('height', totalHeight);

          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            scope.$apply();
          };
          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.updateActual(actualValue);
          });
          
          //Vuelve a renderizar la gráfica en caso de cambios en la data
          scope.$watch('actual', function(newActual) {
            scope.updateActual(newActual);
          }, true);


          var dotsInRow = Math.floor(totalWidth / (dotSize+margin));
          var dotsInCol = Math.floor((totalHeight-marginBottom) / (dotSize+margin));
          var active = Math.round((dotsInRow*dotsInCol)*(actualPercentage/100));
          var dotCnt = 1;

          svg.append('g').attr('id', 'dot-container');

          for(var y=0; y<dotsInCol; y++){
            for(var i=0; i<dotsInRow; i++){
              var color = dotColor.active;
              if(dotCnt > active){
                color = dotColor.inactive;
              }

              svg.select('#dot-container').append('circle')
                .attr('fill', color)
                .attr('cx', ((dotSize)+margin)*(i+1))
                .attr('cy', (dotSize+margin)*(y+1))
                .attr('r', dotSize/2)
                .attr('id', 'dot-'+dotCnt)
                .attr('class', 'dot');

              dotCnt++;
            }
          }


          svg.append('text')
            .attr('fill', '#FFF')
            .attr('x', 16)
            .attr('y', totalHeight)
            .style('font-size','14px')
            .attr('text-anchor', 'middle')
            .text(actualValue)
            .attr('id','text-actual');

          svg.append('text')
            .attr('fill', '#FFF')
            .attr('x', 40)
            .attr('y', totalHeight)
            .style('font-size','9px')
            .attr('text-anchor', 'middle')
            .text(' / '+totalValue)
            .attr('id','text-total');



          //Actualiza la gráfica y los textos asociados
          scope.updateActual = function(valorActual) {
            //Si no hay parametros no continúa
            if (!valorActual) {
                return;
            }
            //Porcentaje actual de circulos marcados
            var actualPercentage = (valorActual*100)/totalValue;

            var active = Math.round((dotsInRow*dotsInCol)*(actualPercentage/100));
            var dotCnt = 1;

            for(var y=0; y<dotsInCol; y++){
              for(var i=0; i<dotsInRow; i++){
                var color = dotColor.active;
                if(dotCnt > active){
                  color = dotColor.inactive;
                }

                svg.select('#dot-container')
                  .select('#dot-'+dotCnt)
                    .attr('fill', color);

                dotCnt++;
              }
            }

            svg.select('#text-actual').text(valorActual);

          };
        });
      }};
}]);