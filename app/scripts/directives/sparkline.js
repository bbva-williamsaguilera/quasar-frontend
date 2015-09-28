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
      link: function(scope, ele) {
        d3Service.d3().then(function(d3) {

          var renderTimeout;
          
          
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          var sideBarProportion = 0.20;
          var width = d3.select(ele[0])[0][0].offsetWidth - (d3.select(ele[0])[0][0].offsetWidth * sideBarProportion),
                height = 45;

          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          var totalHeight = 130;

          var tagWidth = (d3.select(ele[0])[0][0].offsetWidth * sideBarProportion) * 0.40;

          var chartMargin = 35;

          svg.attr('height', totalHeight);

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


          var chartColors = {
            'blue':'#009FE8',
            'yellow':'#FED888',
            'magenta':'#C8175E',
            'white':'#FFFFFF'
          };

          var totalLocations = scope.data.locations.length;
          var ySpace = 0;
          if(totalLocations == 1){
            ySpace = 40;
          }

          svg.append('g').attr('class', 'svg-perm svg-category-container');
          for(var i=0; i<totalLocations; i++){
            var monitor = scope.data;
            svg.select('g.svg-category-container')
                .append('g')
                    .attr('class', 'svg-perm svg-category')
                    .attr('id',monitor.locations[i].key)
                    .attr('data-order', i+1);

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('rect')
                .attr('fill', chartColors[scope.data.color])
                .attr('width', tagWidth)
                .attr('height', 23)
                .attr('x', totalWidth-tagWidth)
                .attr('y', i*40 + ySpace)
                .attr('class', 'svg-perm');

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('rect')
                .attr('fill', 'transparent')
                .attr('stroke', chartColors[scope.data.color])
                .attr('stroke-width',3)
                .attr('width', 70)
                .attr('height', 30)
                .attr('x', (totalWidth-tagWidth-70))
                .attr('y', (i*40)+1 + ySpace)
                .attr('class', 'svg-perm');

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('text')
                .attr('fill', '#000')
                .attr('x', (totalWidth-tagWidth+3))
                .attr('y', ((i)*40) + 14 + ySpace)
                .style('font-size','7px')
                .style('font-weight', 'bold')
                .attr('class', 'svg-perm location-title')
                .text(monitor.locations[i].name);

            
          }

          //Cubierta para datos finales
          svg.append('rect')
            .attr('width',5)
            .attr('height', height+(chartMargin*2))
            .attr('y', 0)
            .attr('x', width-3)
            .attr('class', 'svg-perm')
            .fill('#000');

          //Renderiza la gráfica y los textos asociados
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

                //Guarda todos los elementos antiguos para eliminarlos al hacer un nuevo render
                var oldElements =  svg.selectAll(':not(.svg-perm)');

                var locationValues = [];
                for(var i=0; i<data.locations.length; i++){
                    if(data.locations[i].data && data.locations[i].data.length > 0){

                        var dataPoint = data.locations[i].data;
                        
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

                        var lastValue = Math.round(dataPoint[dataPoint.length-1][1]);
                        
                        locationValues.push([i, lastValue]);

                        svg.select('g.svg-category-container').select('#'+data.locations[i].key)
                            .append('text')
                            .attr('fill', '#fff')
                            .attr('x', (totalWidth-tagWidth-62))
                            .attr('y', (i*40) + 22 + ySpace)
                            .style('font-size','17px')
                            .attr('data-value', lastValue)
                            .text(lastValue +data.suffix);
                    }
                }

                //Elimina elementos antiguos
                oldElements.remove();

                //Ordena elementos

                locationValues.sort(function(a,b){ return b[1]-a[1]; });
                if(locationValues.length > 1){
                  for(i=0; i<locationValues.length; i++){
                    var cat = svg.select('g.svg-category-container')
                      .select('#'+data.locations[locationValues[i][0]].key);
                    if(cat
                      .attr('data-order') != (i+1)){

                      var dif = (i+1) - cat.attr('data-order');
                      var trans = cat.attr('transform');
                      var baseTrans = trans;
                      if(!trans){
                        baseTrans = 'translate(0,0)';
                        trans = 'translate(0,'+40*dif+')';
                      }else{
                        var curY = trans.substring(trans.lastIndexOf(',')+1,trans.lastIndexOf(')'));
                        var newY = parseFloat(curY) + (40*dif);
                        trans = 'translate(0,'+newY+')';
                      }

                      cat.attr('data-order', (i+1));
                      cat.attr('transform', baseTrans).transition()
                          .duration(500)
                          .attr('transform', trans);

                    }
                  }
                }

            }, 1000);
          };
        });
      }};
}]);