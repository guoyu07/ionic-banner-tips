angular.module('bing.ionic.content.banner', ['ionic']);
/* global angular */
;(function (angular,undefined) {
  'use strict';

  angular.module('bing.ionic.content.banner')
    .directive('ionContentBanner', [
      '$interval',
      function ($interval) {
        return {
          restrict: 'E',
          // 继承父级的作用域
          scope: true,
          link: function ($scope, $element) {
            var stopInterval;

            $scope.currentIndex = 0;

            /**
            *text 文本是一个数组，可以设置间隔事件显示
            */
            if($scope.text.length > 1) {
              stopInterval = $interval(function () {
                $scope.currentIndex = ($scope.currentIndex < $scope.text.length - 1) ? $scope.currentIndex + 1 : 0;
              }, $scope.interval);
            }

            /**
            *监听销毁事件，销毁元素和循环定时器
            */
            $scope.$on('$destroy', function() {
              $element.remove();
              if(stopInterval) {
                $interval.cancel(stopInterval);
              }
            });
          },

          template:
          '<div class="content-banner-text-wrapper">' +
            '<div ng-repeat="item in text track by $index" ng-class="{active: $index === currentIndex}" class="content-banner-text" ng-bind-html="item"></div>' +
          '</div>' +
          '<button class="content-banner-close button button-icon icon {{::icon}}" ng-click="close()"></button>'
        };
      }]);

})(angular);

/**
 * @$ionicContentBanner service
 * @name $ionicContentBanner
 * @module ionic
 * @一个易用的服务，方便使用者在controller中使用
 */
;(function (angular, ionic, undefined) {
  'use strict';

  angular.module('bing.ionic.content.banner')
    .factory('$ionicContentBanner', [
      '$document',
      '$rootScope',
      '$compile',
      '$timeout',
      '$ionicPlatform',
      '$ionicScrollDelegate',
      function ($document, $rootScope, $compile, $timeout, $ionicPlatform, $ionicScrollDelegate) {

        function isActiveView (node) {
          // 从当前节点开始每一层父级节点
          while (node !== null && node.nodeName !== 'BODY') {
            var navView = node.getAttribute("nav-view");

            // 只要检测该节点的父节点有一个是等于cached，便可以知道这个视图不是活动视图
            if(navView !== null && navView === 'cached') {
              return false;
            }
            node = node.parentNode;

          }
          // 没有找到父级节点的nav-cached的，说明该视图一定是活动视图，返回true
          return true;
        }

        function getActiveView (body) {
          // 所有活动的ion-view
          var views = body.querySelectorAll('ion-view[nav-view="active"]');

          // 如果只有一个活动ion-view
          if (views.length === 1) {
            return views[0];
          }
          // 将所有views分解成数组，然后使用filter()过滤，callback()函数返回true时，将会用当前的过滤元素数组保存在一个新的数组中
          return Array.prototype.slice.call(views).filter(function (view) {
            return isActiveView(view);
          })[0];
        }

        /**
         * @ngdoc method
         * @name $ionicContentBanner#show
         * @description
         * 显示banner的函数
         */
        function contentBanner (opts) {
          /**
          创建一个新的作用域
          */
          var scope = $rootScope.$new(true);

          /**
          继承配置
          */
          angular.extend(scope, {
            icon: 'ion-ios-close-empty',
            transition: 'vertical',
            interval: 7000,
            type: 'info',
            $deregisterBackButton: angular.noop,
            closeOnStateChange: true,
            autoClose: null,
            delegateHandle:null
          }, opts);

          // 编译模板
          var classes = 'content-banner ' + scope.type + ' content-banner-transition-' + scope.transition,
              
              /**
              *编译后的模板元素
              */
              element = scope.element = $compile('<ion-content-banner class="' + classes + '"></ion-content-banner>')(scope),
              
              body = $document[0].body,

              /**
              *改变状态时关闭banner
              */
              stateChangeListenDone = scope.closeOnStateChange ?
                $rootScope.$on('$stateChangeSuccess', function() { scope.close(); }) :
                  angular.noop;
          /**
          *注册物理返回键事件
          *返回一个取消句柄
          */
          scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(
            function() {
              $timeout(scope.close);
            },300);

          /**
          *关闭banner的function
          */
          scope.close = function() {
            if(scope.removed) {
              return;
            }
            
            scope.removed = true;

            ionic.requestAnimationFrame(function () {
              element.removeClass('content-banner-in');

              $timeout(function() {
                scope.$destroy();
                element.remove();
                body = stateChangeListenDone = null;
              }, 400);
            });
            // 执行解绑物理返回按钮事件 
            scope.$deregisterBackButton();
            // 监听状态改变执行事件
            stateChangeListenDone();
          };

          /**
          *显示banner
          */

          scope.show = function() {
            if(scope.removed) {
              return;
            }

            if(!scope.delegateHandle) {
              // 活动视图添加编译后模板
              getActiveView(body).querySelector('.scroll-content').appendChild(element[0]);
            
            }else {
              // 活动视图添加编译后模板
              $ionicScrollDelegate.$getByHandle(scope.delegateHandle).getScrollView().__container.appendChild(element[0]);
              
            }
            
            ionic.requestAnimationFrame(function () {
              $timeout(function () {
                element.addClass('content-banner-in');
                //设置自动关闭间隔事件
                if (scope.autoClose) {
                  $timeout(function () {
                    scope.close();
                  }, scope.autoClose, false);
                }
              }, 20, false);
            });
          };

          //set small timeout to let ionic set the active/cached view
          $timeout(function() {
            scope.show();
          }, 50, false);

          // Expose the scope on $ionContentBanner's return value for the sake of testing it.
          scope.close.$scope = scope;

          // 返回取消函数
          return scope.close;
        }

        // 服务返回的对象
        return {
          show: contentBanner
        };
      }]);


})(angular, ionic);
