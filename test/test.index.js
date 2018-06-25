'use strict'
var index = require('../index')
var assert = require('assert')
var nock = require('nock')

describe('Unit Tests', function() {

	describe('format tests', function(){

		it('should return error when data is not an array', function (done) {
			index.format({}, function (err, result) {
				assert.equal(err.message, "Wrong format of input data. Input data is not an array")
				return done()
			})
		})

		it('should return error when array is null', function(done){
			index.format([null], function(err, result){
				assert.equal(err.message,"Wrong format of input data. Array is null")
				return done()

			})
		})

		it('should return error when data component is missing', function(done){
			index.format([{}], function(err,result){
				assert.equal(err.message,"Wrong format of input data. Missing component name")
				return done()

			})
		})

		it('should return error when dependsOn is missing', function(done){
			index.format([{component : "abc"}], function(err,result){
				assert.equal(err.message,"Wrong format of input data. dependsOn is missing")
				return done()

			})
		})

		it('should return error when dependsOn is not array', function(done){
			index.format([{component : "abcd", dependsOn : {}}], function(err,result){
				assert.equal(err.message,"Wrong format of input data. dependsOn is not an array")
				return done()

			})
		})

		it('should return error when options is not a json object', function(done){
			index.format([{component : "abcd", dependsOn : [], options:[]}], function(err,result){
				assert.equal(err.message,"Wrong format of input data. Options is not a json object")
				return done()

			})
		})

		it('should return proper response when data is an empty array', function(done){
			index.format([], function(err, result){
				if(err)
					return done(err)
				assert.deepEqual(result, {})
				return done()
			})
		})

		it('should return proper response when data is in proper format', function(done){
			index.format([{component : "image.jpg", dependsOn : ["abc.docx","def.txt"]},
			{component : "abc.docx", dependsOn : ["def.txt"]},
			{component :"def.txt", dependsOn:[]}], function(err,result){
				if(err)
					return done(err)
				assert.deepEqual(result, {"abc.docx" :  {"incomingfile" : ["def.txt"], "outgoingfile"  : ["image.jpg"]},
					"def.txt" : {"incomingfile" : [], "outgoingfile" : ["image.jpg", "abc.docx"]},
					"image.jpg" : {"incomingfile" :  ["abc.docx", "def.txt"],"outgoingfile":[]}})
				return done()
			})
		})

		it('should return proper response when data is in proper format with options', function(done){
			var input = 
				[
					{
						component : "image.jpg",
						dependsOn : ["abc.docx", "def.txt"],
						options:{
							url:'http://localhost:8080/api/bears',
							method:'GET',
							headers:{},
							data:{}
					    }
					},
					{
						component : "abc.docx",
						dependsOn : ["def.txt"],
						options:{
						url:'http://localhost:8080/api/bears/5b1ea2531c62f70c34f78fbd',
						method:'GET',
						headers:{},
						data:{}
					    }
					},
					{
					   	component:"def.txt",
					   	dependsOn:[]
					}
				]	
			var expectedResult = {

				"abc.docx" : {
					"incomingfile"  : ["def.txt"],
					"options" : {
						url:'http://localhost:8080/api/bears/5b1ea2531c62f70c34f78fbd',
						method:'GET',
						headers:{},
						data:{}
				  	},
					"outgoingfile" : ["image.jpg"]
				},
				"def.txt" : {
					"incomingfile" : [],
					"outgoingfile" : ["image.jpg", "abc.docx"]
				}, 
				"image.jpg" : {
					"incomingfile" :  ["abc.docx", "def.txt"],
					"options" : {
						url : 'http://localhost:8080/api/bears',
						method : 'GET',
						headers : {},
						data : {}
					},
					"outgoingfile" : []
				}

			}

			index.format(input, function(err, result){
				if(err)
					return done(err)
				assert.deepEqual(result, expectedResult)
				return done()
			})		
		})
	})
		

	describe('topologicalSort tests',function(){

		it('should return error when changedFormat is not a json object', function (done) {
			index.topologicalSort([], function (err, result) {
				assert.equal(err.message, "Wrong format of input data. Input data is not a json object")
				return done()
			})
		})

	    it('should return error when dependencies are cyclic', function (done) {
			index.topologicalSort(
			{
				"1":{"incomingfile":["4"],"outgoingfile":["2"]},
				"2":{"incomingfile":["1"],"outgoingfile":["5", "3"]},
				"3":{"incomingfile":["2"],"outgoingfile":["4"]},
				"4":{"incomingfile":["3","5"],"outgoingfile":["1"]},
				"5":{"incomingfile":["2"],"outgoingfile":["4"]}
			},
			function (err, result) {
				assert.deepEqual(err.message, "Dependencies are cyclic")
				return done()
			})
		})

		it('should return proper response when dependencies are not cyclic', function (done) {
			index.topologicalSort(
			{
				"1" : {"incomingfile" : [],"outgoingfile" : ["2","4"]},
				"2" : {"incomingfile" : ["1"],"outgoingfile" : ["5", "3"]},
				"3" : {"incomingfile" : ["2"],"outgoingfile" : ["4"]},
				"4" : {"incomingfile" : ["3","5","1"],"outgoingfile" : []},
				"5" : {"incomingfile" : ["2"],"outgoingfile" : ["4"]}
			},
			function (err, result){
				if(err)
					return done(err)
				assert.deepEqual(result, [{"component":"1"}, {"component":"2"},  {"component":"3"}, {"component":"5"}, {"component":"4"}])
				return done()
				})
		})

		
	})

	describe('resolveDependency tests', function(){

		it('should return proper response when dependencies are cyclic with options', function (done) {
			index.resolveDependency(
			[
				{
					component : "1", 
					dependsOn : [], 
					"options": {
						url : 'http://localhost:8080/api/bears',
						method:'GET',
						headers:{},
						data:{}
						} 
				},
				{
					component : "2", 
					dependsOn : [], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b1d6d74e981cd0cb4b12340',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "3", 
					dependsOn : [], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30774ebebd0f1700a39acf',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "4", 
					dependsOn : ["1","2"], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30bc334f6ca315d04e20db',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "5", 
					dependsOn : ["3", "6"], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30bdb20ec1641a385eed1e',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "6", 
					dependsOn : ["4"], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30bdc40ec1641a385eed1f',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "7", 
					dependsOn : ["5"], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30bdda0ec1641a385eed20',
						method : 'GET',
						headers : {},
						data : {}
					}
				},
				{
					component : "8", 
					dependsOn : ["6", "7"], 
					"options" :
					{
						url : 'http://localhost:8080/api/bears/5b30bdf70ec1641a385eed21',
						method : 'GET',
						headers : {},
						data : {}
					}
				}
			],
			function (err, result){
				if(err)
					return done(err)
				assert.deepEqual(result,[
						{
							"component" : "1", 
					 		"options" : {
								url : 'http://localhost:8080/api/bears',
								method : 'GET',
								headers : {},
								data : {}
							}
						},
					    {
						  	"component" : "2",
							"options" :
							{
								url : 'http://localhost:8080/api/bears/5b1d6d74e981cd0cb4b12340',
								method : 'GET',
								headers : {},
								data : {}
							} 
						}, 
					    {
							"component" : "3",
							"options" :
						    {
								url : 'http://localhost:8080/api/bears/5b30774ebebd0f1700a39acf',
								method : 'GET',
								headers : {},
								data : {}
							}
					    },
					    {
						   	"component" : "4",
						    "options" :
							{
								url : 'http://localhost:8080/api/bears/5b30bc334f6ca315d04e20db',
								method : 'GET',
								headers : {},
								data : {}
							}
						}, 
					    {
						    "component" : "6",
						    "options" :
							{
								url : 'http://localhost:8080/api/bears/5b30bdc40ec1641a385eed1f',
								method : 'GET',
								headers : {},
								data : {}
							}
						}, 
						{	
							"component" : "5",
						     "options" :
							{
								url : 'http://localhost:8080/api/bears/5b30bdb20ec1641a385eed1e',
								method : 'GET',
								headers : {},
								data : {}
							}
						}, 
					    {
					   		"component" : "7",
						    "options" :
						    {
								url : 'http://localhost:8080/api/bears/5b30bdda0ec1641a385eed20',
								method : 'GET',
								headers : {},
								data : {}
						    
							}
						}, 
					    {
					   		"component" : "8",
					    	"options" :
							{
								url : 'http://localhost:8080/api/bears/5b30bdf70ec1641a385eed21',
								method : 'GET',
								headers : {},
								data : {}
							} 
						}
					])
				return done()
			})
		})

	})


	describe('resolveDependencyAndMakeApiCalls', function(){

		before(function(done){
			nock('www.createresources.com')
			.get('/knife')
			.reply(200, "request processed")
			.get('/ingredients')
			.reply(200, "request processed")
			.post('/food')
			.reply(200, "request processed")
			return done()
		})

		it('should return proper response and make API calls ', function (done){
			index.resolveDependencyAndMakeApiCalls(
				[
					{
						component : "1", 
						dependsOn : [], 
						"options":
							{
								url:'http://www.createresources.com/knife',
								method:'GET',
								headers:{},
								data:{}
							} 
					},
					{
						component : "2", 
						dependsOn : ["1"], 
						"options":
							{
								url:'http://www.createresources.com/ingredients',
								method:'GET',
								headers:{},
								data:{}
							} 

					},
					{
						component : "3", 
						dependsOn : ["1","2"], 
						"options":
							{
								url:'http://www.createresources.com/food',
								method:'POST',
								headers:{"food" : "dhokla"},
								data:{}
							} 
					}
				],
				function(err, result){
				if(err)
					return done(err)
				return done()
		    })
		})	
	})
})