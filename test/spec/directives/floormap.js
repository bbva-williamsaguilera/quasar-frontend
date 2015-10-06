'use strict';

describe('Directive: floorMap', function () {

  // load the directive's module
  beforeEach(module('quasarFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<floor-map></floor-map>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the floorMap directive');
  }));
});
