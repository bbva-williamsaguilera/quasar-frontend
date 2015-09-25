'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:sparkline
 * @description
 * # sparkline
 */
angular.module('quasarFrontendApp')
  .directive('sparkline', ['$window', '$timeout', 'd3Service', 
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

          var renderTimeout;
          
          
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          var width = d3.select(ele[0])[0][0].offsetWidth - (d3.select(ele[0])[0][0].offsetWidth * 0.20),
                height = 25;

          var chartMargin = 15;

          svg.attr('height', 120);

          $window.onresize = function() {
            scope.$apply();
          };

          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.render(scope.data);
          });

          scope.$watch('data', function(newData) {
            scope.render(newData);
          }, true);


          for(var i=0; i<scope.data.locations.length; i++){
            svg.append('text')
                .attr('fill', '#fff')
                .attr('x', (width+75))
                .attr('y', ((i)*20) + 10)
                .attr('class', 'svg-perm-elem')
                .text(scope.data.locations[i].name);
          }

          //Cubierta para datos finales
          svg.append('rect')
            .attr('width',5)
            .attr('height', height+(chartMargin*2))
            .attr('y', 0)
            .attr('x', width-3)
            .attr('class', 'svg-perm-elem')
            .fill('#000');

          scope.render = function(data) {

            if (!data) {
                return;
            }
            if (renderTimeout){
                clearTimeout(renderTimeout);
            } 

            renderTimeout = $timeout(function() {
                var x = d3.scale.linear()
                    .range([0, width]);

                var y = d3.scale.linear()
                    //.range([height, 0]);
                    .range([height+chartMargin, chartMargin]);

                var line = d3.svg.line()
                    .x(function(d) { 
                        return x(d[0]); 
                    })
                    .y(function(d) { 
                        return y(d[1]); 
                    })
                    .interpolate('basis');

                //Remueve todos los elementos al hacer un nuevo render
                var oldElements =  svg.selectAll(':not(.svg-perm-elem)');

                for(var i=0; i<data.locations.length; i++){
                    if(data.locations[i].data){

                        var dataPoint = data.locations[i].data;
                        data.locations[i].maxData = dataPoint[dataPoint.length-1][1];

                        x.domain(d3.extent(dataPoint, function(d) { 
                            return d[0]; 
                        }));
                        y.domain(d3.extent(dataPoint, function(d) { 
                            return d[1]; 
                        }));

                        svg.insert('path',':first-child')
                            .datum(dataPoint)
                            .attr('class', 'line '+data.color)
                            .attr('d', line);



                        svg.append('text')
                            .attr('fill', '#fff')
                            .attr('x', (width+15))
                            .attr('y', ((i)*20) + 10)
                            .text(Math.round(dataPoint[dataPoint.length-1][1] * 100)/100 +data.suffix);
                    }
                }

                oldElements.remove();



            }, 200);
          };
        });
      }};
}]);