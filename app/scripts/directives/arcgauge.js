'use strict';

/**
 * @ngdoc directive
 * @name quasarFrontendApp.directive:arcGauge
 * @description
 * # arcGauge
 */
angular.module('quasarFrontendApp')
  .directive('arcGauge', ['$window', '$timeout', 'd3Service', 
  function($window, $timeout, d3Service) {
    return {
      restrict: 'AE',
      scope: {
        actual: '=',
        label: '@',
        onClick: '&'
      },
      link: function(scope, ele) {
        d3Service.d3().then(function(d3) {

          //Numero de separaciones del gauge
          var totalSecciones = 18;

          //Margen entre las secciones
          var margenSeccion = 2;

          //Atributo de valor actual
          var actualValue = scope.actual;

          if(actualValue > 100){
            actualValue = 100;
          }

          //Seccion seleccionada
          var seccionMarcada = Math.floor((actualValue*totalSecciones) / 100);
          
          var gaugeColor = ['#9BC741','#EDBC3E','#AB1D5D'];

          //Elemento SVG ajustado al 100% del contenedor
          var svg = d3.select(ele[0])
            .append('svg')
            .style('width', '100%');

          
          
          //Ancho y alto total de la gráfica
          var totalWidth = d3.select(ele[0])[0][0].offsetWidth;
          if(totalWidth === undefined || totalWidth <=0){
            totalWidth = svg[0][0].offsetWidth;
          }
          //console.log(totalWidth);
          var totalHeight = 55;

          //Establece el alto de grafica
          svg.attr('height', totalHeight);

          //Responsive, vuelve a renderizar en caso de un redimensionamiento de pantalla ACTUALMENTE NO ES RESPONSIVE
          $window.onresize = function() {
            //scope.$apply();
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

          function centerTranslation() {
            return 'translate('+totalWidth/2 +','+ totalHeight +')';
          }

          
          svg.append('g')
            .attr('id', 'arc-container')
            .attr('transform', centerTranslation());

          var arc = d3.svg.arc()
            .innerRadius(totalHeight-18)
            .outerRadius(totalHeight-5)
            .startAngle(function(d,i) {
              var anchoSep = (Math.floor(180/totalSecciones));
              return deg2rad(anchoSep*i);
            })
            .endAngle(function(d,i) {
              var anchoSep = (Math.floor(180/totalSecciones));

              return deg2rad((anchoSep*i)+(anchoSep-margenSeccion));
            });


          function deg2rad(deg) {
            return ((deg-90) * Math.PI / 180);
          }


          svg.select('#arc-container')
            .selectAll('path')
            .data(new Array(totalSecciones))
            .enter().append('path')
              .attr('fill', function(d,i){
                  if(i === seccionMarcada){

                    var rangoColor = Math.floor((actualValue*gaugeColor.length)/100);

                    return gaugeColor[rangoColor];
                  }else{
                    return '#3E3E3D';
                  }
                }
              )
              .attr('id', function(d,i){return 'sec-'+i;})
              .attr('d', arc);

          

          svg.append('text')
            .attr('fill', '#FFF')
            .attr('x', (totalWidth/2)-4)
            .attr('y', totalHeight-2)
            .style('font-size','20px')
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text(actualValue)
            .attr('id','text-actual');

          svg.append('text')
            .attr('fill', '#FFF')
            .attr('x', ((totalWidth/2)-4)+(2 * 9))
            .attr('y', totalHeight-7)
            .style('font-size','13px')
            .attr('text-anchor', 'middle')
            .text('%');



          //Actualiza la gráfica y los textos asociados
          scope.updateActual = function(valorActual) {
            //Si no hay parametros no continúa
            if (!valorActual) {
                return;
            }

            var rangoColor = Math.floor((valorActual*gaugeColor.length)/100);
            seccionMarcada = Math.floor((valorActual*totalSecciones) / 100);
          
            svg.select('#arc-container')
              .selectAll('path')
              .attr('fill', '#3E3E3D');

            svg.select('#sec-'+seccionMarcada).attr('fill', gaugeColor[rangoColor]);

            svg.select('#text-actual').text(valorActual);
            

          };
        });
      }};
}]);