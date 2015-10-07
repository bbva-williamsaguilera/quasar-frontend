'use strict';

describe('Directive: waitClock', function () {

  // load the directive's module
  beforeEach(module('quasarFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<wait-clock></wait-clock>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the waitClock directive');
  }));
});
