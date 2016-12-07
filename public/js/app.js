var app = angular.module('app', ['ui.router', 'ui.bootstrap','ngCookies','uiGmapgoogle-maps','nvd3','ngTable']);//, 

app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        //Problem with injection
        //,$stateParams

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'layouts/dashboard.html'
            })
            .state('data', {
                url: '/data',
                templateUrl: 'layouts/data.html'
            })
            .state('keymetrics', {
                url: '/keymetrics',
                templateUrl: 'layouts/keymetrics.html'
            })            
    }
]);

/**
 * Widget Header Directive
 */

app.directive('rdWidgetHeader', rdWidgetTitle);

function rdWidgetTitle() {
    var directive = {
        requires: '^rdWidget',
        scope: {
            title: '@',
            icon: '@'
        },
        transclude: true,
        template: '<div class="widget-header"><div class="row"><div class="pull-left"><i class="fa" ng-class="icon"></i> {{title}} </div><div class="pull-right col-xs-6 col-sm-4" ng-transclude></div></div></div>',
        restrict: 'E'
    };
    return directive;
};

app.directive('rdWidgetFooter', rdWidgetFooter);

function rdWidgetFooter() {
    var directive = {
        requires: '^rdWidget',
        transclude: true,
        template: '<div class="widget-footer" ng-transclude></div>',
        restrict: 'E'
    };
    return directive;
};


app.directive('rdWidgetBody', rdWidgetBody);

function rdWidgetBody() {
    var directive = {
        requires: '^rdWidget',
        scope: {
            loading: '@?',
            classes: '@?'
        },
        transclude: true,
        template: '<div class="widget-body" ng-class="classes"><rd-loading ng-show="loading"></rd-loading><div ng-hide="loading" class="widget-content" ng-transclude></div></div>',
        restrict: 'E'
    };
    return directive;
};

app.directive('rdWidget', rdWidget);

function rdWidget() {
    var directive = {
        transclude: true,
        template: '<div class="widget" ng-transclude></div>',
        restrict: 'EA'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
};

app.directive('rdLoading', rdLoading);

function rdLoading() {
    var directive = {
        restrict: 'AE',
        template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
    };
    return directive;
};


app.controller('AlertsCtrl', ['$scope', AlertsCtrl]);

function AlertsCtrl($scope) {
    $scope.alerts = [{
        type: 'success',
        msg: 'Thanks for visiting! Feel free to create pull requests to improve the dashboard!'
    }, {
        type: 'danger',
        msg: 'Found a bug? Create an issue with as many details as you can.'
    }];

    $scope.addAlert = function() {
        $scope.alerts.push({
            msg: 'Another alert!'
        });
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
}
app.controller('DataViewCtrl', ['$scope', '$element', '$window', '$http', '$interval', 'NgTableParams', DataViewCtrl]);

function DataViewCtrl($scope, $element, $window, $http, $interval, NgTableParams) {

    var update_interval = 3000;

    var mobileView = 992;

    $scope.dataupdate = false;

    $scope.mobiletable = [];

    $scope.iframeHeight = window.innerHeight;


    var w = angular.element($window);
    $scope.$watch(
        function () {
            return $window.innerWidth;
        },
        function (value) {
            $scope.windowWidth = value;
        },
        true
        );

    w.bind('resize', function () {
        $scope.$apply();
    });


    $scope.issuesclosed = 0;
    $scope.issuesopen = 0;

    var init_load = false;

    function loaddata() {

        $scope.dataupdate = false;

        d3.csv("data/issues.csv", function (d) {
            return {
                customername: d['Customer name'],
                subtimestamp: Date.parse(d['Submission Timestamp']),
                email: d['customer email address'],
                description: d['Description'],
                status: d['Status'],
                closedtimestamp: Date.parse(d['Closed Timestamp']),
                employeename: d['Employee name']
            };
        }, function (data) {
            $scope.issuesclosed = 0;
            $scope.issuesopen = 0;
            for (var i = 0; i < data.length; i++) {
                if (data[i].status == "Closed") {
                    $scope.issuesclosed = $scope.issuesclosed + 1;
                    console.log('Issue open', $scope.issuesclosed);
                } else {
                    $scope.issuesopen = $scope.issuesopen + 1;
                }
            }

            $scope.mobiletable = data;

            console.log('Data!!!', data);

            $scope.tp = new NgTableParams({}, { dataset: data });
        });

    };

    $scope.callAtInterval = loaddata;
      
    //init load of data at program start 
    if (init_load == false) {
        loaddata();
        init_load = true;
    }

    var stopTime = $interval(function () { $scope.callAtInterval(); }, update_interval, false);

    $element.on('$destroy', function () {
        $interval.cancel(stopTime);
    });


}
app.controller('GeoSpatialCtrl', ['$scope', '$element', '$http', '$interval', 'NgTableParams', GeoSpatialCtrl]);

function GeoSpatialCtrl($scope, $element, $http, $interval, NgTableParams) {
    
    var update_interval = 3000;

    $scope.dataupdate = false;

    $scope.map = { center: { latitude: 48.20705775, longitude: 16.38044357 }, zoom: 8 };

    $scope.places = [];
    
    function loaddata() {
        
        $scope.dataupdate = false;
        
        $http.get("data/stations.json").then(function (response) {
            return response.data.stations;
        }).then(function (places) {

            if ($scope.places.length != places.length) {
                $scope.dataupdate = !$scope.dataupdate;
            } else {

                if ($scope.places.length > 0) {
                    for (var i = 0; i < places.length; i++) {
                        if (places[i].title != $scope.places[i].title){
                            console.log('$scope.places[i]xx',$scope.places[i]);
                            console.log('NE check',places[i].title,$scope.places[i].title);
                            $scope.dataupdate = true;
                        }
                        if (places[i].employees != $scope.places[i].employees) {
                            $scope.dataupdate = true;
                        }
                    }
                }

            }

            console.log('$scope.dataupdate',$scope.dataupdate);

            for (var i = 0; i < places.length; i++) {
                places[i]['options'] = { labelClass: 'labels', labelAnchor: '12 60', labelContent: places[i].title + ' , employees: ' + places[i].employees };
            }

            $scope.places = places;
        });
    }

    $scope.callAtInterval = loaddata;

    var stopTime = $interval(function () { $scope.callAtInterval(); }, update_interval, false);

    $element.on('$destroy', function () {
        $interval.cancel(stopTime);
    });




}
app.controller('KeyMetricsCtrl', ['$scope', '$element', '$http', '$interval', 'NgTableParams', KeyMetricsCtrl]);

function KeyMetricsCtrl($scope, $element, $http, $interval, NgTableParams) {

    var update_interval = 3000;

    var mobileView = 992;
    
    $scope.dataupdate = false;

    $scope.issuesclosed = 0;
    $scope.issuesopen = 0;

    var init_load = false;

    $scope.data = [
        {
            "key": "Quantity",
            "bar": true,
            "values": []
        }
    ];

    $scope.data2 = [
        {
            "values": [],      //values - represents the array of {x,y} data points
            key: 'Living Room Temp.', //key  - the name of the series.
            color: '#ff7f0e',  //color - optional: choose your own line color.
            strokeWidth: 3,
            classed: 'dashed'
        }
    ];

    function loaddata() {

        $scope.dataupdate = false;

        d3.csv("data/issues.csv", function (d) {
            return {
                customername: d['Customer name'],
                subtimestamp: Date.parse(d['Submission Timestamp']),
                email: d['customer email address'],
                description: d['Description'],
                status: d['Status'],
                closedtimestamp: Date.parse(d['Closed Timestamp']),
                employeename: d['Employee name']
            };
        }, function (data) {
            $scope.issuesclosed = 0;
            $scope.issuesopen = 0;
            for (var i = 0; i < data.length; i++) {
                if (data[i].status == "Closed") {
                    $scope.issuesclosed = $scope.issuesclosed + 1;
                    console.log('Issue open', $scope.issuesclosed);
                } else {
                    $scope.issuesopen = $scope.issuesopen + 1;
                }
            }

            $scope.tp = new NgTableParams({}, { dataset: data });
        });

        $http.get("data/issuecount.json").then(function (response) {
            var data = response.data;

            if (data.length != $scope.data[0].values.length) {
                $scope.dataupdate = !$scope.dataupdate;
                $scope.data[0].values = [];               
                // $scope.$apply;
            }

            var dummy = [];

            var last = undefined;
            for (var i = 0; i < data.length; i++) {
                // console.log('customers',data[i]);
                var d = Date.parse(data[i].Date);
                // console.log(d,',',data[i].Customers);                
                // $scope.data[0].values.push([d, data[i].Customers]);
                last = [d, data[i].Issues];
                dummy.push([d, data[i].Issues]);
            }

            $scope.data = [
                {
                    "key": "Quantity",
                    "bar": true,
                    "values": dummy
                }
            ];                
            //bugfix
            $scope.$apply;  
                                            
        })

        $http.get("data/customers.json").then(function (response) {
            var data = response.data;
            if (data.length != $scope.data2[0].values.length) {
                $scope.dataupdate = !$scope.dataupdate;
                // $http.get("data/issuecount.json").then(function (res) {
                //     return response.data;
                // }).then(function (data) { })           
            }

            $scope.data2[0].values = [];

            for (var i = 0; i < data.length; i++) {
                // console.log('customers',data[i]);
                var d = Date.parse(data[i].Date);
                // console.log(d,',',data[i].Customers);
                $scope.data2[0].values.push([d, data[i].Customers]);
            }
            
            
        });



    };

    $scope.callAtInterval = loaddata;
      
    //init load of data at program start 
    if (init_load == false) {
        loaddata();
        init_load = true;
    }

    var stopTime = $interval(function () { $scope.callAtInterval(); }, update_interval, false);

    $scope.options = {
        chart: {
            type: 'historicalBarChart',
            height: 450,
            margin: {
                top: 20,
                right: 20,
                bottom: 65,
                left: 50
            },
            x: function (d) { return d[0]; },
            y: function (d) { return d[1]; },/// 100000
            showValues: true,
            valueFormat: function (d) {
                return d3.format(',.1f')(d);
            },
            duration: 100,
            xAxis: {
                axisLabel: 'Time',
                tickFormat: function (d) {
                    return d3.time.format('%x')(new Date(d))
                },
                rotateLabels: 30,
                showMaxMin: false
            },
            yAxis: {
                axisLabel: 'Issues',
                axisLabelDistance: -10,
                tickFormat: function (d) {
                    return d3.format(',.1f')(d);
                }
            },
            tooltip: {
                keyFormatter: function (d) {
                    return d3.time.format('%x')(new Date(d));
                }
            },
            zoom: {
                enabled: true,
                scaleExtent: [1, 20],
                useFixedDomain: false,
                useNiceScale: false,
                horizontalOff: false,
                verticalOff: true,
                unzoomEventType: 'dblclick.zoom'
            }
        },
        title: {
            enable: true,
            text: 'Number of reported issues'
        }
    };

    $scope.options2 = {
        chart: {
            type: 'lineChart',
            height: 450,
            margin: {
                top: 20,
                right: 20,
                bottom: 80,
                left: 55
            },
            x: function (d) { return d[0]; },
            y: function (d) { return d[1]; },
            useInteractiveGuideline: true,
            dispatch: {
                stateChange: function (e) { console.log("stateChange"); },
                changeState: function (e) { console.log("changeState"); },
                tooltipShow: function (e) { console.log("tooltipShow"); },
                tooltipHide: function (e) { console.log("tooltipHide"); }
            },
            xAxis: {
                axisLabel: 'Time',
                tickFormat: function (d) {
                    return d3.time.format('%x')(new Date(d))
                },
                rotateLabels: 30,
                showMaxMin: false
            },
            yAxis: {
                axisLabel: 'Temperature C°',
                axisLabelDistance: -10,
                tickFormat: function (d) {
                    return d3.format(',.1f')(d);
                }
            },
            callback: function (chart) {
                // console.log("!!! lineChart callback !!!");
            },
            zoom: {
                enabled: true,
                scaleExtent: [1, 20],
                useFixedDomain: false,
                useNiceScale: false,
                horizontalOff: false,
                verticalOff: true,
                unzoomEventType: 'dblclick.zoom'
            }
        },
        title: {
            enable: true,
            text: 'Temperature'
        }
    };


    $scope.customers = [];

         $element.on('$destroy', function() {
            $interval.cancel(stopTime);
          });

}
app.controller('MainCtrl', ['$scope', '$cookieStore', MainCtrl]);

function MainCtrl($scope, $cookieStore) {
    /**
     * Sidebar Toggle & Cookie Control
     */

    var mobileView = 992;

    $scope.getWidth = function () {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = !$cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function () {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function () {
        $scope.$apply();
    };
}