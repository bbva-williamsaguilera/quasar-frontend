'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:floorMap
 * @description
 * # floorMap
 */
angular.module('quasarFrontendApp')
  .directive('floorMap', ['$window', '$timeout', 'd3Service', 
  function($window, $timeout, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        occupancy: '='
      },
      link: function(scope, ele, attr) {

        //Imagen de fondo
        var imgSrc = attr.src;

        var tag = '<img src="'+imgSrc+'" class="img-responsive"/>';

        ele.append(tag);

        d3Service.d3().then(function(d3) {

          //Datos de ocupación
          var occupancy = scope.occupancy;

          //Colores
          var colors = {
            'free':'#9BC741',
            'occupied':'#AB1D5D'
          };

          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          var totalHeight = d3.select(ele[0])[0][0].offsetHeight;
          
          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', totalWidth);

          
          

          //Establece el alto de grafica
          svg.attr('height', totalHeight)
            .style('position', 'absolute')
            .style('top', '0px')
            .style('left', '0px');
          
          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            scope.$apply();
          };
          scope.$watch(function() {
            return angular.element($window)[0].innerWidth;
          }, function() {
            scope.updateOccupancy(occupancy);
          });
          
          //Vuelve a renderizar la gráfica en caso de cambios en la data
          scope.$watch('occupancy', function(newOccupancy) {
            scope.updateOccupancy(newOccupancy);
          }, true);

          //Escala en X con respecto al width del elemento
          var x = d3.scale.linear()
              .domain([0,1000])
              .range([0,totalWidth]);

          //Escala en Y con respecto al height del elemento
          var y = d3.scale.linear()
              .domain([0,1000])
              .range([0,totalHeight]);


          //Coordenadas de las zonas
          var zoneCoord = [
            {
                'nombre':'planta3',
                'coord':{
                    'bano-mujer-1':[[460.957, 88.05],[483.627, 97.484],[493.702, 88.05],[478.589, 81.761]],
                    'bano-hombre-1':[[498.740, 103.773],[516.372,110.062],[534.005,103.773],[508.816,94.339]],
                    'bano-mujer-2':[[498.740, 261.006],[523.929, 264.15],[541.561, 261.006],[516.372, 248.427]],
                    'bano-hombre-2':[[536.523, 267.295],[561.712,276.729],[574.307,267.295],[556.675,261.006]],
                    'bano-minus':[[559.193,257.861],[581.863, 270.44],[594.458,261.006],[571.788,248.427]],
                    'tower2':[[914.357,135.364], [974.811,157.232],[1037.783,135.22], [977.329,110.062]],
                    'coconut2':[[722.921, 207.547],[790.931, 229.559],[833.753, 210.691],[755.667, 185.534]]
                }
            },
            {
                'nombre':'planta2',
                'coord':{
                    'bano-hombre-1':[[498.74, 451.773], [516.372, 458.062], [534.005, 451.773], [508.816, 442.339]],
                    'bano-hombre-2':[[536.523, 615.2950000000001], [561.712, 624.729], [574.307, 615.2950000000001], [556.675, 609.006]],
                    'bano-minus':[[559.193, 605.861], [581.863, 618.44], [594.458, 609.006], [571.788, 596.427]],
                    'bano-mujer-1':[[460.957, 436.05], [483.627, 445.484], [493.702, 436.05], [478.589, 429.76099999999997]],
                    'bano-mujer-2':[[498.74, 609.006], [523.929, 612.15], [541.561, 609.006], [516.372, 596.427]],
                    'coconut2':[[722.921, 555.547], [790.931, 577.559], [833.753, 558.691], [755.667, 533.534]],
                    'tower2':[[914.357, 483.36400000000003], [974.811, 505.23199999999997], [1037.783, 483.22], [977.329, 458.062]]
                } 
            },
            {
                'nombre':'entreplanta',
                'coord':{
                    'bano-hombre':[[408.74, 703.773], [426.37199999999996, 710.062], [444.005, 703.773], [418.816, 694.3389999999999]],
                    'bano-mujer':[[370.957, 688.05], [393.627, 697.484], [403.702, 688.05], [388.589, 681.761]],
                    'creative-room':[[183.879,745.283],[277.078,798.742],[410.579,738.993],[279.596,691.823]],
                    'war-room':[[443.324,694.968],[501.259,723.270],[589.420,685.534],[534.005,660.377]]
                }
            },
            {
                'nombre':'planta1',
                'coord':{
                    'bano-hombre-1':[[498.74, 799.773], [516.372, 806.062], [534.005, 799.773], [508.816, 790.3389999999999]],
                    'bano-hombre-2':[[536.523, 963.2950000000001], [561.712, 972.729], [574.307, 963.2950000000001], [556.675, 957.006]],
                    'bano-minus':[[559.193, 953.861], [581.863, 966.44], [594.458, 957.006], [571.788, 944.427]],
                    'bano-mujer-1':[[460.957, 784.05], [483.627, 793.4839999999999], [493.702, 784.05], [478.589, 777.761]],
                    'bano-mujer-2':[[498.74, 957.006], [523.929, 960.15], [541.561, 957.006], [516.372, 944.427]],
                }
            }
        ];

        for(var i=0; i<zoneCoord.length; i++){
          var zona = zoneCoord[i];
          svg.append('g')
            .attr('id', 'group-'+zona.nombre);


          for(var ny=0; ny<Object.keys(zona.coord).length; ny++){
            var key = Object.keys(zona.coord)[ny];

            if(zona.coord[key] != false ){
              
              var path = 'M'+x(zona.coord[key][0][0])+','+y(zona.coord[key][0][1]);
              path = path + 'L'+x(zona.coord[key][1][0])+','+y(zona.coord[key][1][1]);
              path = path + 'L'+x(zona.coord[key][2][0])+','+y(zona.coord[key][2][1]);
              path = path + 'L'+x(zona.coord[key][3][0])+','+y(zona.coord[key][3][1]);
              path = path + 'L'+x(zona.coord[key][0][0])+','+y(zona.coord[key][0][1]);
              
              var color = colors.free;
              if(occupancy[i].ocupacion[key] == false){
                color = colors.occupied;
              }

              svg.select('#group-'+zona.nombre)
                .append('path')
                  .attr('d', path)
                  .attr('stroke', 'transparent')
                  .attr('fill', color)
                  .attr('id', 'path-'+zona.nombre+'-'+key);
            }
          }
        }


          //Actualiza la gráfica y los textos asociados
          scope.updateOccupancy = function(newOccupancy) {

            
            //Si no hay parametros no continúa
            if (!newOccupancy) {
                return;
            }

            for(var i=0; i<newOccupancy.length; i++){
              var zona = newOccupancy[i];

              for(var ny=0; ny<Object.keys(zona.ocupacion).length; ny++){
                var key = Object.keys(zona.ocupacion)[ny];

                var color = colors.free;
                if(zona.ocupacion[key] == false){
                  color = colors.occupied;
                }
                svg.select('#path-'+zona.nombre+'-'+key)
                  .attr('fill', color);

              }
            }
            

          };
        });
      }};
}]);