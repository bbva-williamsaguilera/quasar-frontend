'use strict';

describe('Controller: ApihourCtrl', function () {

  // load the controller's module
  beforeEach(module('quasarFrontendApp'));

  var ApihourCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ApihourCtrl = $controller('ApihourCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
