'use strict'
var _ = require('lodash')
var logger = require('winston')
var request = require('request')
var async = require('async')
var nock = require('nock')

var topologicalSort = function(changeFormat, callback){
	if(!_.isPlainObject(changeFormat))
   		return callback({message:"Wrong format of input data. Input data is not a json object"})
   
	var Sorted = [] 
	
	while(!_.isEmpty(changeFormat)){
		//console.log("changeFormat " + JSON.stringify(changeFormat))
		var componentName = getEligibleNode(changeFormat)
		if(componentName === -1){
			return callback({message:"Dependencies are cyclic"})
		}

		if(changeFormat.hasOwnProperty(componentName)){
			var temp = {}
			temp.component = componentName
			if(changeFormat[componentName].hasOwnProperty("options"))
				temp.options = changeFormat[componentName].options
			Sorted.push(temp)
			var a = changeFormat[componentName].outgoingfile;
			for(var k = 0; k<a.length; k++){
				logger.info("a[k]" + JSON.stringify(a[k])+"\n")
				if(changeFormat.hasOwnProperty(a[k])) {
					var tempOutgoingFile = changeFormat[a[k]].incomingfile
					deleteFromList(tempOutgoingFile, componentName)
				}		
			}
			delete changeFormat[componentName]
		}
	}

	return callback(null, Sorted)
}


var getEligibleNode = function(changeFormat){
	for(var componentName in changeFormat){
		if(changeFormat.hasOwnProperty(componentName)){
			var val = changeFormat[componentName]
			if(val.incomingfile.length === 0){
				return componentName
			}
		}
	}	
	return -1
}

var deleteFromList = function(list, value) {
	var index = list.indexOf(value)
	list.splice(index,1)
} 

var contains = function(list, value){
	for(var i = 0; i<list.length; i++){
		if(value ===  list[i])
			return true
	}
	return false	
}

var format = function (data, callback) {
   var result = {}
   if(!_.isArray(data)){
   	return callback(new Error("Wrong format of input data. Input data is not an array"))
   }
   
    for(var i = 0; i<data.length; i++){
		if(!data[i]){
			return callback(new Error("Wrong format of input data. Array is null"))
		}
		if(!data[i].component){
			return callback(new Error("Wrong format of input data. Missing component name"))
		}
      	var componentName = data[i].component
      	result[componentName] = {}
      	if(!data[i].dependsOn ){
      		return callback(new Error("Wrong format of input data. dependsOn is missing"))
   		}
   		if(!_.isArray(data[i].dependsOn)){
   			return callback(new Error("Wrong format of input data. dependsOn is not an array"))
        }
   		if(!!data[i].options && !_.isPlainObject(data[i].options)){
   			return callback(new Error("Wrong format of input data. Options is not a json object"))
        }

      	result[componentName].incomingfile = data[i].dependsOn
      	result[componentName].outgoingfile = []
      	if(data[i].hasOwnProperty("options"))
      		result[componentName].options = data[i].options
      	for(var j = 0; j<data.length; j++){
      		if(i === j)continue;
      		if(contains(data[j].dependsOn, componentName)){
      			result[componentName].outgoingfile.push(data[j].component)
      		}
      	}	
	}
	logger.info("result " + JSON.stringify(result))
	return callback(null, result)
}



var resolveDependency  = function (data, callback){
	format(data, function(err, changeFormat){
		if(err) return callback(err)
		topologicalSort(changeFormat, function(err, result){
			if(err) return callback(err)
			return callback(null, result)
		})	
	})
}

var resolveDependencyAndMakeApiCalls = function(data, callback) {
	resolveDependency(data, function (err, result) {
		if(err) return callback(err)
		makeAsyncCalls(result, function (err) {
			if(err) return callback(err)
			return callback()
		})
	})
}

var makeAsyncCalls = function (result, callback) {
	async.eachSeries(result, function (element, eachCallback) {
	//Send request for element
		var options = element.options
		request(options,function(err, res, body) {
			if(err)
			return eachCallback(err)
		else
			return eachCallback()
		})
	// When response arrives, call eachCallback
	}, function (err) {
		if(err) return callback(err)
		return callback()
	})
}

module.exports.format = format
module.exports.resolveDependency = resolveDependency
module.exports.topologicalSort = topologicalSort
module.exports.resolveDependencyAndMakeApiCalls = resolveDependencyAndMakeApiCalls

