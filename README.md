# Simplerequest
> Node request made simple

## Getting Started

### Example

Simple get example
```javascript
var simplerequest = require('simplerequest');
simplerequest('http://example.com', function(err, window) {
	//Here you can work with result as window object
});
```


Complex post example
```javascript
var simplerequest = require('simplerequest');
simplerequest({
	url:'https://example.com',
	method:'post',
	port:8080, //if you pass https, 443 will be the default, unless you pass another port
	timeout:10, //in seconds
	headers:{
		'Referer':'http://example.com',
		'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
	},
	parsing:'text', //the result will not be parsed
	post: {
		'param':'value1'
	},
	responseCharset:'iso-8859-1'
}, function(err, text) {
	//Here you can work with result as pure text
});
```