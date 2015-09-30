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

          //Función con timeout para hacer render de la gráfica
          var renderTimeout;
          //Tiempo a esperar para renderizar la gráfica
          var renderTimeoutTime = 500;
          
          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          //Proporción en decimales de la barra lateral con respecto al espacio de la gráfica
          var sideBarProportion = 0.20;

          //Ancho y alto del área de las lineas de la gráfica
          var width = d3.select(ele[0])[0][0].offsetWidth - (d3.select(ele[0])[0][0].offsetWidth * sideBarProportion),
                height = 45;

          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          var totalHeight = 130;

          //Ancho del tag donde se muestra el nombre de las locaciones
          var tagWidth = (d3.select(ele[0])[0][0].offsetWidth * sideBarProportion) * 0.50;

          //Margen de las lineas de la gráfica
          var chartMargin = [15,28];

          //Establece el alto de grafica
          svg.attr('height', totalHeight);

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


          //Funcion que aclara u oscurece un color RGB
          function shadeColor1(color, percent) {  
            var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt; // jshint ignore:line
            return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
          }

          //Alinea los tags de manera correcta en caso de que solo haya uno
          var totalLocations = scope.data.locations.length;
          var ySpace = 0;
          if(totalLocations == 1){
            ySpace = 40;
          }

          //Añade un grupo general de clase svg-perm (permanente) para contener los elementos
          svg.append('g').attr('class', 'svg-perm svg-category-container');

          //Por cada location añade un tag, con texto y contenedores
          for(var i=0; i<totalLocations; i++){
            var monitor = scope.data;
            svg.select('g.svg-category-container')
                .append('g')
                    .attr('class', 'svg-perm svg-category')
                    .attr('id',monitor.locations[i].key)
                    .attr('data-order', i+1);

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('rect')
                .attr('class', 'svg-perm title-container')
                .attr('fill', shadeColor1(scope.data.color, (i*20)))
                .attr('width', tagWidth)
                .attr('height', 23)
                .attr('x', totalWidth-tagWidth-28)
                .attr('y', i*40 + ySpace);

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('rect')
                .attr('class', 'svg-perm value-container')
                .attr('fill', 'transparent')
                .attr('stroke', shadeColor1(scope.data.color, (i*20)))
                .attr('stroke-width',3)
                .attr('width', 70)
                .attr('height', 30)
                .attr('x', (totalWidth-tagWidth-98))
                .attr('y', (i*40)+1 + ySpace);

            svg.select('g.svg-category-container').select('#'+monitor.locations[i].key)
                .append('text')
                .attr('fill', '#000')
                .attr('x', (totalWidth-tagWidth-25))
                .attr('y', ((i)*40) + 14 + ySpace)
                .style('font-size','7px')
                .style('font-weight', 'bold')
                .attr('class', 'svg-perm location-title')
                .text(monitor.locations[i].name);
          }

          //Cubierta para datos finales
          /*svg.append('rect')
            .attr('width',5)
            .attr('height', height+(chartMargin*2))
            .attr('y', 0)
            .attr('x', width-3)
            .attr('class', 'svg-perm')
            .fill('#000');*/

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

                //Escala en X con respecto al width del elemento
                var x = d3.scale.linear()
                    .range([chartMargin[0], width]);

                //Escala en Y con respecto al height del elemento
                var y = d3.scale.linear()
                    .range([height+chartMargin[1], chartMargin[1]]);

                //Funcion de creación de linea, donde el eje X será el valor en la posición 0 del array
                //... y el valor Y será el valor en la posición 1
                var line = d3.svg.line()
                    .x(function(d) { 
                        return x(d[0]); 
                    })
                    .y(function(d) { 
                        return y(d[1]); 
                    })
                    .interpolate('basis');


                //Guarda todos los elementos antiguos para eliminarlos al hacer un nuevo render
                // ... excepto los marcados como permanentes
                var oldElements =  svg.selectAll(':not(.svg-perm)');

                //Variable que almacena el dato final de cada locación para luego hacer el ordenamiento
                var locationValues = [];

                //Por cada locación inserta una linea, y un valor final
                for(var i=0; i<data.locations.length; i++){
                    if(data.locations[i].data && data.locations[i].data.length > 0){

                        var dataPoint = data.locations[i].data;
                        
                        //Establece el dominio de x y para d3
                        x.domain(d3.extent(dataPoint, function(d) { 
                            return d[0]; 
                        }));
                        y.domain(d3.extent(dataPoint, function(d) { 
                            return d[1]; 
                        }));

                        //Variable de punto minimo y maximo para dibujar los circulos
                        var maxPoint = d3.max(dataPoint, function(d){ 
                          return [d[1], d[0]]; 
                        });

                        var minPoint = d3.min(dataPoint, function(d){ 
                          return [d[1], d[0]]; 
                        });

                        //Inserta la linea
                        svg.insert('path',':first-child')
                            .datum(dataPoint)
                            .attr('class', 'line '+data.locations[i].key)
                            .attr('stroke', shadeColor1(scope.data.color, (i*20)))
                            .attr('d', line);

                        
                        //Inserta los circulos con texto de max y min
                        svg.append('circle')
                          .attr('fill', shadeColor1(scope.data.color, (i*20)))
                          .attr('cx', x(maxPoint[1]))
                          .attr('cy', y(maxPoint[0]))
                          .attr('r', 12);

                        svg.append('text')
                            .attr('fill', '#000')
                            .attr('x', x(maxPoint[1]))
                            .attr('y', y(maxPoint[0])+3)
                            .style('font-size','7px')
                            .attr('text-anchor', 'middle')
                            .text(Math.round(maxPoint[0]) + data.suffix);

                        svg.append('circle')
                          .attr('fill', shadeColor1(scope.data.color, (i*20)))
                          .attr('cx', x(minPoint[1]))
                          .attr('cy', y(minPoint[0]))
                          .attr('r', 12);

                        svg.append('text')
                            .attr('fill', '#000')
                            .attr('x', x(minPoint[1]))
                            .attr('y', y(minPoint[0])+3)
                            .style('font-size','7px')
                            .attr('text-anchor', 'middle')
                            .text(Math.round(minPoint[0]) + data.suffix);



                        //Guarda el ultimo valor
                        var lastValue = Math.round(dataPoint[dataPoint.length-1][1]);
                        locationValues.push([i, lastValue]);

                        //Agrega el texto con el ultimo valor en el cuadro
                        svg.select('g.svg-category-container').select('#'+data.locations[i].key)
                            .append('text')
                            .attr('fill', '#fff')
                            .attr('x', (totalWidth-tagWidth-90))
                            .attr('y', (i*40) + 22 + ySpace)
                            .style('font-size','17px')
                            .attr('data-value', lastValue)
                            .text(lastValue +data.suffix);
                    }
                }

                //Elimina elementos antiguos
                oldElements.remove();

                //Ordena elementos y agrega triangulos indicadores
                locationValues.sort(function(a,b){ return b[1]-a[1]; });
                if(locationValues.length >= 1){
                  for(i=0; i<locationValues.length; i++){
                    var cat = svg.select('g.svg-category-container')
                      .select('#'+data.locations[locationValues[i][0]].key);

                    var newY = 0;
                    if(cat.attr('data-order') != (i+1)){

                      var dif = (i+1) - cat.attr('data-order');
                      var trans = cat.attr('transform');
                      var baseTrans = trans;
                      if(!trans){
                        baseTrans = 'translate(0,0)';
                        newY = 40*dif;
                        trans = 'translate(0,'+newY+')';
                      }else{
                        var curY = trans.substring(trans.lastIndexOf(',')+1,trans.lastIndexOf(')'));
                        newY = parseFloat(curY) + (40*dif);
                        trans = 'translate(0,'+newY+')';
                      }

                      cat.attr('data-order', (i+1));
                      cat.attr('transform', baseTrans).transition()
                          .duration(500)
                          .attr('transform', trans);

                    }

                    //Obtiene la ultima coordenada de la linea asociada al tag
                    var linePathLastCoord = svg.select('.line.'+data.locations[locationValues[i][0]].key).attr('d');
                    linePathLastCoord = linePathLastCoord.substr(linePathLastCoord.lastIndexOf('L')+1);
                    linePathLastCoord = linePathLastCoord.split(',');
                    
                    //Agrega el triangulo indicador
                    var yStart = ((i*40) + ySpace)+newY;
                    var xCoord = cat.select('rect.value-container').attr('x')-1;
                    
                    svg
                      .append('path')
                      .attr('fill', shadeColor1(scope.data.color, (locationValues[i][0]*20)))
                      .attr('d', 'M'+linePathLastCoord[0]+','+linePathLastCoord[1]+'L'+xCoord+','+yStart+'V'+(yStart + 33)+'Z');

                  }
                }

            }, renderTimeoutTime);
          };
        });
      }};
}]);