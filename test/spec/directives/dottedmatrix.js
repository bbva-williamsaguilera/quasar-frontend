'use strict';

describe('Directive: dottedMatrix', function () {

  // load the directive's module
  beforeEach(module('quasarFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dotted-matrix></dotted-matrix>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the dottedMatrix directive');
  }));
});
