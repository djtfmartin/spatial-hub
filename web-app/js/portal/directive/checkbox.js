/*
 * Copyright (C) 2016 Atlas of Living Australia
 * All Rights Reserved.
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * Created by Temi on 16/09/2016.
 */
(function (angular) {
    'use strict';
    angular.module('checkbox-change-directive', []).directive('checkboxChange',
        [ function () {
            return {
                replace: false,
                require: 'ngModel',
                scope: false,
                link: function (scope, element, attrs, ngModelCtrl) {
                    element.on('change', function () {
                        scope.$apply(function () {
                            ngModelCtrl.$setViewValue(element[0].value);
                        });
                    });
                }
            };
        }])
}(angular));