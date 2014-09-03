var encoding = require('encoding'),
	querystring = require('querystring').stringify,
	url = require('url'),
	jsdom = require('jsdom'),
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
	};
module.exports = function(_cfg, callback) {
	'use strict';
	
	var ok = true,
	baseCfg = {
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
			
			if(cfg.parsing === 'html') {
				var cb = function(err, window) {
					if(!ok)
						return;
					callback(err, window);
				};
				try {
					jsdom.env(responseText, cb);
				}
				catch(e) {
					ok = false;
					callback(e);
				}
			}
			else if(cfg.parsing === 'json') {
				try {
					responseText = JSON.parse(responseText);
					callback(null, responseText);
				}
				catch(e) {
					ok = false;
					callback(e);
				}
			}
			else {
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