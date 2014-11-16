'use strict';
var app = angular.module('myApp', ['ngRoute', 'ipCookie', 'ui.sortable', 'myApp.version']);

/* Makes main textarea to be always in focus */
app.directive('syncFocusWith', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
        link: function($scope, $element, attrs) {
            $scope.$watch("focusValue", function(currentValue, previousValue) {
                $element[0].focus();
            })
        }
    }
})

/* Panel resizer */
app.directive('resizer', function($document, ipCookie) {
    return function($scope, $element, $attrs) {
        $element.on('mousedown', function(event) {
            event.preventDefault();
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });
        function mousemove(event) {
            if ($attrs.resizer == 'vertical') {
                // Handle vertical resizer
                var x = event.pageX;
				var viewportWidth = document.documentElement.clientWidth;
				var leftWidth = (x/viewportWidth)*100;
                if ($attrs.resizerMax && leftWidth > $attrs.resizerMax) {
                    leftWidth = parseInt($attrs.resizerMax);
                }
				if ($attrs.resizerMin && leftWidth < $attrs.resizerMin) {
                    leftWidth = parseInt($attrs.resizerMin);
                }
				
				ipCookie("leftWidth", leftWidth, { expires: 2000 });
				
                $element.css({
                    left: leftWidth + '%'
                });
                    angular.element(document.querySelector($attrs.resizerLeft)).css({
                        width: leftWidth + '%',
                    });
                    angular.element(document.querySelector($attrs.resizerRight)).css({
                        width: (100 - leftWidth) + '%'
                    });
            } else {
                // Handle horizontal resizer
                var y = window.innerHeight - event.pageY;
                $element.css({
                    bottom: y + 'px'
                });
                    angular.element(document.querySelector($attrs.resizerTop)).css({
                        bottom: (y + parseInt($attrs.resizerHeight)) + 'px'
                    });
                    angular.element(document.querySelector($attrs.resizerBottom)).css({
                        height: y + 'px'
                    });
            }
        }
        function mouseup() {
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
        }
    };
})

app.factory("jsonDefer",function($http, $q){
    var _getDetails = function(value){

        var deferred = $q.defer();
        $http.get(value).then(function(modal){
            deferred.resolve(modal);
        });

        return deferred.promise;
    };
	return { _getDetails:_getDetails };
});

app.controller('ArabicKeyCtrl', function($scope, $http, ipCookie, jsonDefer) {
	$scope.text = "";
	$scope.options = [];
	$scope.cookieExpire = 2000;
	$scope.transliterationScheme = $scope.options['transliterationScheme'] = "Kamal";
	
	$scope.transliterationJson = ["json/Kamal.json", "json/ArabTex.json", "json/Indo.json"];
	$scope.transliterationInfo = [];
	$scope.transliterationTables = [];
	$scope.transliterationKeys = [];
	$scope.transliterationSchemeOptions = [];
	
	$scope.fontOptions = [
		{
			fontValue: 'scheherazade',
			fontName: 'Sceherazade'
		},
		{
			fontValue: 'amiri',
			fontName: 'Amiri'
		},
		{
			fontValue: 'lateef',
			fontName: 'Lateef'
		},
		{
			fontValue: 'Arabic Typesetting',
			fontName: 'Arabic Typesetting'
		},
		{
			fontValue: 'Traditional Arabic',
			fontName: 'Traditional Arabic'
		},
		{
			fontValue: 'Simplified Arabic',
			fontName: 'Simplified Arabic'
		}
	];
	
	$scope.fontSizeOptions = [];
	for(var i=20; i<=100; i++){
		$scope.fontSizeOptions.push(i);
	}

	$scope.initCookie = function(cookieName, cookieValue){
		if(typeof(ipCookie(cookieName)) == 'undefined'){
			$scope.options[cookieName] = cookieValue;
			ipCookie(cookieName, $scope.options[cookieName], { expires: $scope.cookieExpire });
			
			if(cookieName == "transliterationScheme"){
				$scope.transliterationScheme = cookieValue;
				ipCookie(cookieName, $scope.transliterationScheme, { expires: $scope.cookieExpire });
			}
		}
		else{
			$scope.options[cookieName] = ipCookie(cookieName);
			if(cookieName == "transliterationScheme"){
				$scope.transliterationScheme = ipCookie(cookieName);
			}
		}
	}
	
	$scope.initCookie("font", "amiri");
	$scope.initCookie("fontSize", "60");
	$scope.initCookie("transliterateTyping", true);
	$scope.initCookie("transliterationScheme", "Kamal");
	$scope.initCookie("leftWidth", "50");
	
	$scope.focusInput = function() {
		$scope.isFocused = !$scope.isFocused;
	};
	
	$scope.write = function(letter){
		$scope.text += letter;
		$scope.focusInput();
	}
	
	$scope.saveState = function(){
		ipCookie("font", $scope.options['font'], { expires: $scope.cookieExpire });
		ipCookie("fontSize", $scope.options['fontSize'], { expires: $scope.cookieExpire });
		ipCookie("transliterateTyping", $scope.options['transliterateTyping'], { expires: $scope.cookieExpire });
		ipCookie("transliterationScheme", $scope.options['transliterationScheme'], { expires: $scope.cookieExpire });
		ipCookie("transliterationScheme", $scope.transliterationScheme, { expires: $scope.cookieExpire });
		$scope.focusInput();
	}
	
    angular.forEach($scope.jsons, function(url){
        $http.get(url).success(function(data){
            $scope.abc.push(data);    
        });
    });
	
	angular.forEach($scope.transliterationJson, function(value, key){
        var promiseData = jsonDefer._getDetails(value);
        promiseData.then(function(result){
			if(result.data){
				$scope.transliterationSchemeOptions.push(result.data.TransliterationScheme);
				$scope.transliterationTables[result.data.TransliterationScheme] = result.data.TransliterationMap;
				$scope.transliterationInfo[result.data.TransliterationScheme] = result.data;
				$scope.transliterationKeys[result.data.TransliterationScheme] = angular.copy($scope.transliterationTables[result.data.TransliterationScheme]);
				$scope.buildRecursiveTransliteration();
			}
        });
	});
	
	$scope.dragControlListeners = {
		accept: function (sourceItemHandleScope, destSortableScope) {return true},
		itemMoved: function (event) { console.log("itemMoved"); },
		orderChanged: function(event) { console.log("orderChanged");}
	};
	
	$scope.buildRecursiveTransliteration = function(){
		angular.forEach($scope.transliterationTables[$scope.transliterationScheme], function(transliterationGroup, transliterationGroupKey){
			angular.forEach(transliterationGroup.groupSet, function(transliterationList, transliterationListKey){
				angular.forEach(transliterationList.transliteration, function(transliterationChar, transliterationCharKey){
					if(
						transliterationChar.length >= 2 && 
						transliterationChar != "[void]" && 
						transliterationGroup.groupName != "grammar rules"
					){
						var result = $scope.transliterate(transliterationChar);
						transliterationList.transliteration.push(result);
					}
				});
			});
		});
	}
	
	$scope.transliterate = function(text){
		if($scope.options['transliterateTyping']){
		
			var txt = (typeof(text) == "undefined" ? $scope.text : text);

			angular.forEach($scope.transliterationTables[$scope.transliterationScheme], function(transliterationGroup, transliterationGroupKey){
				angular.forEach(transliterationGroup.groupSet, function(transliterationList, transliterationListKey){
					angular.forEach(transliterationList.transliteration, function(transliterationChar, transliterationCharKey){
						if(transliterationGroup.groupName != "grammar rules"){
							transliterationChar = transliterationChar.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
						}
						var re = new RegExp(transliterationChar,"g");
						txt=txt.replace(re,transliterationList.arabicChar);
					});
				});
			});
			
			if(typeof(text) == "undefined") $scope.text = txt; else return txt;
		}
	}
	
});



/* ZeroClipboard code */
var client = new ZeroClipboard( document.getElementById("copyLink") );
client.on( "ready", function( readyEvent ){
	client.on( "aftercopy", function( event ){
		event.target.text = "Copied";
		setInterval(function (){event.target.text = "Copy";}, 3000);
	});
} );