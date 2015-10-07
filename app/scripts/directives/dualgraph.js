'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:dualGraph
 * @description
 * # dualGraph
 */
angular.module('quasarFrontendApp')
  .directive('dualGraph', ['$window', '$timeout', 'd3Service', 
  function($window, $timeout, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        data: '=',
        label: '@',
        onClick: '&'
      },
      link: function(scope, ele, attrs) {
        d3Service.d3().then(function(d3) {

          //Función con timeout para hacer render de la gráfica
          var renderTimeout;
          //Tiempo a esperar para renderizar la gráfica
          var renderTimeoutTime = 500;

          

          var totalHeight = parseInt(attrs.height) || 100;
          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%')
            .attr('height', totalHeight);

          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          
         
          var data = scope.data;

          //Total de gráficos que irán contenidos en la misma gráfica
          var totalGraphs = scope.data.length;

          //Margen entre los gráficos
          var graphMargin = 20;

          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            scope.$apply();
          };
          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.render(scope.data);
          });
          
          //Vuelve a renderizar la gráfica en caso de cambios en la data
          scope.$watch('data', function(newData) {
            scope.render(newData);
          }, true);


          

          

          //Renderiza la gráfica y los textos asociados
          scope.render = function(data) {
            
            //Si no hay datos no continúa
            if (!data) {
                return;
            }
            //Si ya está en proceso de renderizado, mata la función 
            if (renderTimeout){
                clearTimeout(renderTimeout);
            } 

            //renderiza dentro del tiempo especificado
            renderTimeout = $timeout(function() {

                var maxPoint = 0;
                for(var i=0; i<totalGraphs; i++){
                  for(var cnt=0; cnt<data[i].data.length; cnt++){
                    var dataGroup = data[i].data[cnt];
                    if(dataGroup.value > maxPoint){
                      maxPoint = dataGroup.value;
                    }
                  }
                }

                //Escala en X con respecto al width del elemento
                /*var x = d3.scale.linear()
                    .range([chartMargin[0], width]);*/

                var barHeight = totalHeight-20;
                //Escala en Y con respecto al height del elemento
                var y = d3.scale.linear()
                  .domain([maxPoint, 0])
                  .range([20, barHeight]);

                svg.selectAll('*').remove();
                //Por cada location añade un tag, con texto y contenedores
                var groupWidth = totalWidth/totalGraphs;
                for(var i=0; i<totalGraphs; i++){

                  svg.append('g')
                    .attr('id', 'groupdata-'+i)
                    .attr('transform', 'translate('+(i*groupWidth)+',0)')
                    .append('text')
                      .text(data[i].title)
                        .attr('fill', '#FFF')
                        .style('font-size', '6px')
                        .attr('y', totalHeight)
                        .attr('x', groupWidth/2)
                        .attr('text-anchor', 'middle');

                  var barWidth = groupWidth / data[i].data.length;
                  
                  for(var cnt=0; cnt<data[i].data.length; cnt++){

                    var dataGroup = data[i].data[cnt];

                    svg.select('#groupdata-'+i)
                      .append('g')
                      .attr('id', 'bar-'+i+'-'+cnt)
                      .attr('transform', 'translate('+(cnt*barWidth)+',0)')
                      .append('text')
                        .text(dataGroup.tag)
                        .attr('fill', '#FFF')
                        .style('font-size', '5px')
                        .attr('y', totalHeight-10)
                        .attr('x', barWidth/2)
                        .attr('text-anchor', 'middle');

                    svg.select('#groupdata-'+i).select('#bar-'+i+'-'+cnt)
                      .append('rect')
                        .attr('fill', dataGroup.color)
                        .attr('width',barWidth-(barWidth*0.5))
                        .attr('x', (barWidth/2)- ((barWidth-(barWidth*0.5))/2) )
                        .attr('y', y(dataGroup.value))
                        .attr('height', barHeight-y(dataGroup.value));

                    svg.select('#groupdata-'+i).select('#bar-'+i+'-'+cnt)
                      .append('circle')
                        .attr('fill', dataGroup.color)
                        .attr('r',(barWidth-(barWidth*0.5))/2)
                        .attr('cx', (barWidth/2) )
                        .attr('cy', y(dataGroup.value));

                    svg.select('#groupdata-'+i).select('#bar-'+i+'-'+cnt)
                      .append('text')
                        .text(dataGroup.value)
                        .attr('fill', '#FFF')
                        .style('font-size', '8px')
                        .attr('y', y(dataGroup.value)-10)
                        .attr('x', barWidth/2)
                        .style('font-weight', 'bold')
                        .attr('text-anchor', 'middle');

                    

                  }
                }

                //Cover
                svg.append('rect')
                  .attr('fill', '#000')
                  .attr('y', totalHeight-20)
                  .attr('x', 0)
                  .attr('height', 6)
                  .attr('width',totalWidth);

            }  , renderTimeoutTime);
          };
        });
      }};
}]);