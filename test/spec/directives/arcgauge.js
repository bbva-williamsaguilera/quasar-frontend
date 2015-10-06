'use strict';

describe('Directive: arcGauge', function () {

  // load the directive's module
  beforeEach(module('quasarFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<arc-gauge></arc-gauge>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the arcGauge directive');
  }));
});
