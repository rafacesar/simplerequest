var encoding = require('encoding'),
	querystring = require('querystring').stringify,
	url = require('url'),
	jsdom = require('jsdom'),
	xml2js = require('xml2js').parseString,
	plist = require('plist').parse,
	extend = function(base, _new) {
		for(var prop in _new) {
			if(_new.hasOwnProperty(prop)) {
				if(typeof _new[prop] === 'object')
					extend(base[prop], _new[prop]);
				else
					base[prop] = _new[prop];
			}
		}
		return base;
	},
	ok;
module.exports = function(_cfg, callback) {
	'use strict';
	ok = true;

	var baseCfg = {
		url:'#',
		port:80,
		method:'get',
		parsing:'html',
		post:{},
		timeout:30,
		headers:{},
		responseCharset:'utf-8'
	}, http, cfg, options, decode, post, cfgUrl;
	
	if(typeof _cfg === 'string')
		_cfg = {url:_cfg};
	
	cfg = extend(baseCfg, _cfg);
	
	cfg.method = cfg.method.toUpperCase();
	
	if(cfg.url.indexOf('https') === 0) {
		http = require('https');
		if(typeof _cfg.port === 'undefined')
			cfg.port = 443;
	}
	else
		http = require('http');
	
	
	if(typeof cfg.post === 'object')
		post = querystring(cfg.post);
	else
		post = cfg.post;
	
	if(cfg.method === 'POST') {
		if(typeof cfg.headers['Content-Type'] === 'undefined')
			cfg.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		
		if(post.length > 0 && typeof cfg.headers['Content-Length'] === 'undefined')
			cfg.headers['Content-Length'] = post.length;
	}
	
	cfgUrl = url.parse(cfg.url);
	
	options = {
		hostname:cfgUrl.hostname,
		path:cfgUrl.path,
		port:cfg.port,
		method:cfg.method,
		headers: cfg.headers,
		auth:cfgUrl.auth
	};
	
	if(!Buffer.isEncoding(cfg.responseCharset)) {
		decode = function(list, charset) {
			return encoding.convert(Buffer.concat(list), 'utf-8', charset).toString();
		};
	}
	else {
		decode = function(list) {
			return list.join('');
		};
	}
	
	
	
	var req = http.request(options, function(res) {
		var responseText = [];
		
		
		res.on('data', function(chunk) {
			responseText.push(chunk);
		}).on('end', function() {
			if(!ok)
				return;
			
			responseText = decode(responseText, cfg.responseCharset);
			
			switch(cfg.parsing) {
				case 'xHTML':
				case 'fullHtml':
				case 'full-html':
				// case 'html':
					parser.fullHtml(responseText, callback);
					break;
				case 'html':
				case 'lightHtml':
				case 'light-html':
					parser.html(responseText, callback);
					break;
				case 'json':
					parser.json(responseText, callback);
					break;
				case 'xml':
					parser.xml(responseText, callback);
					break;
				case 'plist':
					parser.plist(responseText, callback);
					break;
				default:
					callback(null, responseText);
			}
		});
		
	});
	req.on('error', function(err) {
		ok = false;
		callback(err);
	});
	
	if(cfg.method === 'POST' && post.length > 0)
		req.write(post);
	
	req.setTimeout(1000 * cfg.timeout, function() {
		req.abort();
	});
	
	req.end();
};
var parser = {
	json: function(data, callback) {
		try {
			data = JSON.parse(data);
			callback(null, data);
		}
		catch(e) {
			ok = false;
			callback(e.stack || e);
		}
	},
	fullHtml: function(data, callback) {
		try {
			var document = jsdom.jsdom(data, {
				features: {
					FetchExternalResources:false
				}
			});
			callback(null, document.parentWindow);
		}
		catch(e) {
			ok = false;
			callback(e.stack || e);
		}
	},
	html: function(data, callback) {
		var cb = function(err, window) {
			if(!ok)
				return;
			callback(err, window);
		};
		try {
			jsdom.env(data, cb);
		}
		catch(e) {
			ok = false;
			callback(e.stack || e);
		}
	},
	xml: function(data, callback) {
		try {
			xml2js(data, function (err, xml) {
				if(!ok)
					return;
				callback(err, xml);
			});
		}
		catch(e) {
			ok = false;
			callback(e.stack || e);
		}
	},
	plist: function(data, callback) {
		try {
			data = plist(data);
			callback(null, data);
		}
		catch(e) {
			ok = false;
			callback(e.stack || e);
		}
	}
};