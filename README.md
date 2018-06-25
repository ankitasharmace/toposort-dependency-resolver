## Overview

An easy-to-use dependency resolver using topological sorting.

## Installation

```js
npm install toposort-dependency-resolver
```

then in your code:

```js
dependencyResolver = require('toposort-dependency-resolver')
```

## Usage

This module resolves dependencies between various components and tells us the sequential order in which these components can be safely accessed.
The underlying algorithm being used is topological-sorting via a Directed Acyclic Graph(DAG).

![DAG](/static/directedacyclic.jpg?raw=true)


## API

* resolveDependency(data, callback)

Examples : 
#1
```js
	dependencyResolver.resolveDependency(
			[
				{
					component : "1", 
					dependsOn : [], 
				},
				{
					component : "2", 
					dependsOn : ["1"], 
				},
				{
					component : "3", 
					dependsOn : ["1","2"], 
				}

			],function(err, result) {})
```
			If the input forms a directed acyclic graph,
			err : null
			result: [{"component" : 1"}, {"component" : "2"}, {"component" : "3"}]

#2

```js
	dependencyResolver.resolveDependency(
		   [
           		{
					component : "A", 
					dependsOn : ["B"], 
				},
				{
					component : "B", 
					dependsOn : ["A"], 
				},
				{
					component : "C", 
					dependsOn : ["B"], 
				}
		   ],function(err, result) {})
```
		   err.message : "Dependencies are cyclic"

* resolveDependencyAndMakeApiCalls(data, callback)

Example :

```js
	dependencyResolver.resolveDependencyAndMakeApiCalls(
			[
           		{
					component : "A", 
					dependsOn : [],
					options : {
 						url : 'http://localhost:8080/api/bears',
						method:'GET',
						headers:{},
						data:{}
					} 
				},
				{
					component : "B", 
					dependsOn : ["A"],
					options : {
						url : 'http://localhost:8080/api/bears/',
						method : 'POST',
						headers : {},
						data : {}
					} 
				},
				{
					component : "C", 
					dependsOn : ["B","A"],
					options : {
						url : 'http://localhost:8080/api/bears/5b30774ebebd0f1700a39acf',
						method : 'PUT',
						headers : {},
						data : {}
				    } 
				}
		   ],function(err) {})
```

		If dependencies are cyclic, this function returns err("Dependencies are cyclic").
	    If it is a directed acyclic graph and all the API calls are successful, err is null.



## Unit Tests and coverage

Unit test have been added for all functionalities.

```sh
# Run tests
npm run test

# Run test along with code coverage
npm run coverage
```
![Coverage](/static/coverage.jpg?raw=true)

## Future Enhancements

* Return callback errors based on HTTP status codes of API calls.
* Save the progress of API calls made when an error occurs.
* Add retries to API calls.

## Contributing

Contributions, questions and comments are all welcome and encouraged. For code contributions submit a pull request with unit tests.

## License

This project is licensed under the [MIT License](https://github.com/ankitasharmace/toposort-dependency-resolver/blob/master/LICENSE)

## Meta

Ankita Sharma – ankitasharma.ce@gmail.com
