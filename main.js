
var weatherApp = angular.module('weatherApp',[]);
weatherApp.controller('weatherController',['$scope','weatherFactory',weatherController]);

var SMS_NUMBER_REGEXP = /^([0-9]{8,10})?$/;
var EMAIL_REGEXP = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

function weatherController($scope,weatherFactory){

	$scope.form_details = new Object();
	$scope.form_view_details = new Object();
	$scope.weatherForm;

	$scope.form_details.location = new Array();
	var location_obj = new Object();
	location_obj.name = "";
	$scope.form_details.location.push(location_obj);

	$scope.form_details.name = "";
	$scope.form_details.age = "";
	$scope.form_details.gender = "0";
	$scope.form_details.address = "";
	$scope.form_details.activitySelected = "";
	$scope.form_details.phoneNumber = "";
	$scope.form_details.emailid = "";
	$scope.form_details.travelTime = "";
	$scope.form_details.activities = ['Football', 'Hiking', 'Biking', 'Cricket', 'Fishing', 'Hockey', 'Running', 'Swimming'];
	$scope.locationName = undefined;

	$scope.validation_check = false;

	$scope.weatherDataResult = undefined;

	$scope.inputGroupButtonClick = function(currentGroupClickInstance){
		currentGroupClickInstance.currentTarget.previousElementSibling.focus();	
	}

	// Google Map function

	function initializeGoogleMap(lat_param,lng_param) {
		// Generate google map for selected location
		var googleMapInstance = new google.maps.LatLng(lat_param,lng_param);
		  var mapConfig = {
		    center: googleMapInstance,
		    zoom:15,
		    mapTypeId:google.maps.MapTypeId.ROADMAP
		  };
		  var map = new google.maps.Map(document.getElementById("googleMap"),mapConfig);

		  var marker = new google.maps.Marker({
					  position:googleMapInstance,
					  animation:google.maps.Animation.BOUNCE
					  });

			marker.setMap(map);
	}


	// Display pop up of google map

	$scope.viewMap = function(lat_param,lng_param, city_param, country_param){

		$scope.locationName = city_param+" "+country_param;

		$('#myModal').on('shown.bs.modal', function() {
   			initializeGoogleMap(lat_param,lng_param);
		});
	
	}

	// Add more location

	$scope.addLocation = function(index_param){

		var location_obj = new Object();
		location_obj.name = "";
		$scope.form_details.location.push(location_obj);

	}


	// Remove a location

	$scope.removeLocation = function(index_param){

		$scope.form_details.location.splice(index_param,1);

	}

	// Form validation fxn's

	function formvalidationLocation(location_array_param){

		for(index in location_array_param){
	
			if(location_array_param[index].name === ""){
				var location_array_index = "location_"+index;
				$scope.weatherForm[location_array_index].$check_validity = true;
				$scope.validation_check = true;
			}
		}

	}



	function formValidation(){

		$scope.validation_check = false;

		for(index in $scope.form_details){

			if(index === 'activities'){
				continue;
			}


			if(index === 'location'){

				formvalidationLocation($scope.form_details[index]);

				continue;
			}

			if(angular.isUndefined($scope.weatherForm[index].$modelValue) || $scope.weatherForm[index].$modelValue == ""){

				$scope.weatherForm[index].$check_validity = true;
				
				$scope.validation_check = true;

			}else{

				$scope.weatherForm[index].$check_validity = false;

			}

		}

		if(checkIfValueIsAPhoneNumber($scope.weatherForm['phoneNumber'].$modelValue)){

				$scope.weatherForm['phoneNumber'].$check_validity = true;
				
				$scope.validation_check = true;

		}

		if(checkIfValueIsAEmailAddress($scope.weatherForm['emailid'].$modelValue)){

				$scope.weatherForm['emailid'].$check_validity = true;
				
				$scope.validation_check = true;

		}


	}

	function checkIfValueIsAEmailAddress(formInputObjParam){
		if(EMAIL_REGEXP.test(formInputObjParam)){
			return false;
		}else{
			return true;
		}
	
	}

	function checkIfValueIsAPhoneNumber(formInputObjParam){
		if(formInputObjParam === ""){
			return true;
		}

		if(SMS_NUMBER_REGEXP.test(formInputObjParam)){
			return false;
		}else{
			return true;
		}
	}
	

	$scope.getLocationData = function(currentElementScope){

		formValidation();

		$scope.weatherDataResult = new Array();

		if(angular.isUndefined($scope.form_details.location)){
			return;
		}

		$scope.form_view_details = angular.copy($scope.form_details);

		for(index in $scope.form_view_details.location){
			fetchGoogleCoordinatesAndMappingWeatherDetails($scope.form_view_details.location[index]);
		}
	
			    

	}

	var fetchGoogleCoordinatesAndMappingWeatherDetails = function(location_param){

		var lat = 0;
		var lng = 0;

		// get coordinates from google api and get weather from simple weather for each location
		weatherFactory.getCoordinatesFromGoogleApi(location_param).success(function(response){

			lat = response.results[0].geometry.location.lat;
			lng = response.results[0].geometry.location.lng;

				weatherFactory.getWeatherDetailsFromApi(lat,lng).success(function(response){

					console.log(response);

					for(index in response.query.results.channel.item.forecast){
						if(response.query.results.channel.item.forecast[index].text.toLowerCase().indexOf("snow") > -1){
							response.query.results.channel.item.forecast[index].id = 0;
						}else if(response.query.results.channel.item.forecast[index].text.toLowerCase().indexOf("sun") > -1){
							response.query.results.channel.item.forecast[index].id = 1;
						}else if(response.query.results.channel.item.forecast[index].text.toLowerCase().indexOf("rain") > -1){
							response.query.results.channel.item.forecast[index].id = 2;
						}else{
							response.query.results.channel.item.forecast[index].id = 3;
						}
					}

					response.query.results.channel.lat = lat;
					response.query.results.channel.lng = lng;

					$scope.weatherDataResult.push(response.query.results.channel);
				
				});

		});


	}

}


weatherApp.factory('weatherFactory', ['$http',function($http){

	var factory_service = {};

	factory_service.getCoordinatesFromGoogleApi = function(location_param){

		var key = 'AIzaSyCYVNwrvbZRI0Z8BxzcGldZ2qQQjrciaYk';
		var url = 'https://maps.googleapis.com/maps/api/geocode/json';


		return $http({
 				method:"GET",
 				url: url,
 				// async:true,
 				params:{
 					'address': location_param,
 					'key': key
 				}
 		});

	}

	factory_service.getWeatherDetailsFromApi = function(lat_param,lng_param){

		var url_category = 'https://simple-weather.p.mashape.com/weatherdata';

		return $http({
 				method:"GET",
 				url: url_category,
 				// async:true,
 				params:{
 					lat: lat_param,
 					lng: lng_param
 				},
 				headers: {
 							'X-Mashape-Key': '35fMJeFhchmshOddVYLquWcILgcYp1WRI1sjsnZQwUhoS5hvX1',
 							'Accept': 'application/json'
 							}
 			});

	}

	return factory_service;

}]);

//Date Time Picker directive
weatherApp.directive('datetimepicker', function(){
	return{
		link: function(scope, elm, attrs){
			var dateToDisable = new Date();
			var nextFiveDays = dateToDisable.setDate(dateToDisable.getDate() + 5);
			
			   elm.datetimepicker({

			   	 minDate: 0, // your min date
    			// maxDate:  '+2d',

				  	controlType : 'select',
				  	timepicker: false,
				closeOnDateSelect:true,
				format: 'd-m-Y'
	            });
			   elm.keydown(function(event) { 
				    return false;
			   });
	}
};
});

