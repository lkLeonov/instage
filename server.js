'use strict';

/**************
test accounts:
/kamilczapiga
/elensai
***************/

const fs = require('fs');
const https = require('https');
const http = require('http');
const querystring = require('querystring');

const PORT = 80;
const URL = 'https://www.instagram.com';
const RE = {
	fileReq: /\..{2,4}$/, // get file extension (2 to 4 chars after dot)
	subdir: /\/(.*?)\//,   // between first two '/'
    csrf: /csrftoken=(.*); expires/,
    sid : /sessionid=(.*); expires/,
    mid : /mid=(.*); expires/,
    _sharedData: /_sharedData = (.*);<\/script>/
}


fs.readFile('./index.html', (err, html) => {
    if (err) 
        throw err;
         
    http.createServer((servReq, servRes) => {
    	console.log('CLIENT::GET: ' + servReq.url);

    		// for file request
    		var gotReqFileExt = RE.fileReq.exec(servReq.url);
    		var reqFileExt = gotReqFileExt && gotReqFileExt[0];

    		//for dir request
    		var gotSubdir = RE.subdir.exec(servReq.url); 
    		var subdir = gotSubdir && gotSubdir[0];

    	// Serve dirs

    		// 404 for subdirs
/*    		if ( gotSubdir && servReq.url.slice(-1) === '/' ) { // if not root && has '/' at the end
    			console.log('SERVER::Res: 404');
    			servRes.writeHeader(404, { 'Content-Type': 'text/html'});
    			servRes.end(fs.readFileSync('./404.html')); //TODO: check if file exists
    		}
 */
 			// redirect form /dir/ to /dir
 			if ( gotSubdir && subdir !== '/css/' && subdir !== '/js/' && subdir !== '/fonts/' && subdir !== '/imgs/') {
				servRes.writeHead(302, {'Location': servReq.url.slice(0, -1)});
				servRes.end();
 			}

    	// Serve files

    		// Serve .CSS
    		else if (reqFileExt === '.css' && subdir === '/css/') {
    			//check if file exists
    			fs.access('.' + servReq.url, fs.F_OK, function(err) {
    				if (err) {
    					console.log('SERVER::No such file ' + servReq.url);
    					servRes.end('No such file on server!');
    				}
    				else {
    					fs.readFile('.' + servReq.url, function(err, data){
    						servRes.writeHead(200, {'Content-Type': 'text/css' });
    						servRes.end(data, 'utf-8');
    					});
    					
    				}
    			});
    		}

    		// Serve .TTF
    		else if (reqFileExt === '.ttf' && subdir === '/fonts/') {
    			//check if file exists
    			fs.access('.' + servReq.url, fs.F_OK, function(err) {
    				if (err) {
    					console.log('SERVER::No such file ' + servReq.url);
    					servRes.end('No such file on server!');
    				}
    				else { // DIR.root + DIR.fonts +
    					fs.readFile('.' + servReq.url, function(err, data){
    						servRes.writeHead(200, {'Content-Type': 'application/font-sfnt' });
    						servRes.end(data, 'binary');
    					});

    				}
    			});
    		}

    		// Serve .PNG
    		else if (reqFileExt === '.png' && subdir === '/imgs/') {
    			//check if file exists
    			fs.access('.' + servReq.url, fs.F_OK, function(err) {
    				if (err) {
    					console.log('SERVER::No such file ' + servReq.url);
    					servRes.end('No such file on server!');
    				}
    				else {
    					fs.readFile('.' + servReq.url, function(err, data){
    						servRes.writeHead(200, {'Content-Type': 'image/png' });
    						servRes.end(data, 'binary');
    					});

    				}
    			});
    		}

    		// Serve .JS
    		else if (reqFileExt === '.js' && subdir === '/js/') {
    			//check if file exists
    			fs.access('.' + servReq.url, fs.F_OK, function(err) {
    				if (err) {
    					console.log('SERVER::No such file ' + servReq.url);
    					servRes.end('No such file on server!');
    				}
    				else {
    					fs.readFile('.' + servReq.url, function(err, data){
    						servRes.writeHead(200, {'Content-Type': 'text/javascript' });
    						servRes.end(data, 'utf-8');
    					});

    				}
    			});
    		}

    		
    		else if (servReq.url === '/favicon.ico') {
    			console.log('CLIENT::GET: ' + servReq.url, servRes.statusCode );
    			servRes.writeHead(404);
    			
    			servRes.end('no favicon');
    		}

    		// Serve ROOT & /accounts

    		else if (servReq.url === '/') {
    			servRes.writeHeader(200, { 'Content-Type': 'text/html'});
    			servRes.end(fs.readFileSync('./start.html')); //TODO: check if file exists
    		}
    		else {

		    	https.get(URL + servReq.url + '/', (res) => {
					console.log('SERVER::GET: ' + URL, res.statusCode);
		    	  	
		    	  	if (res.statusCode === 200) {

						const reqData = {
							csrf : RE.csrf.exec( res.headers['set-cookie'][0] )[1],
							sid : RE.sid.exec( res.headers['set-cookie'][2] )[1],
							mid : RE.mid.exec( res.headers['set-cookie'][3] )[1],
						}

						let body = '';
						res.on('data', (d) => {
						body += d;
						});

						res.on('end', () => {
						const _sharedData = JSON.parse( RE._sharedData.exec(body)[1] );
						const uid = _sharedData.entry_data.ProfilePage[0].user.id;

						// GET PHOTOS:

							const postData = querystring.stringify({
							    q: "ig_user(" + uid + "){media.after(0, 40){ nodes {display_src}}}"
							});

							const postReqOptions = {
								hostname: 'www.instagram.com',
								path: '/query/',
								method: 'POST',
								headers: {
						//			"accept": "*/*",
						//			"accept-encoding": "gzip, deflate, br",
						//			"accept-language": 'en-US,en;q=0.9',
								    'Content-Type': 'application/x-www-form-urlencoded',
								    'Content-Length': Buffer.byteLength(postData),
						//			"cache-control":"max-age=0",					    
                        //          "cookie": "csrftoken=" + reqData.csrf + "; mid="+reqData.mid+"; sessionid="+reqData.sid+";  ig_pr=1; ig_vw=1920; s_network=",
									"cookie": "csrftoken=" + reqData.csrf,
						//          "origin":"https://www.instagram.com",
								   	"referer": URL,
						//		    "user-agent":"Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.82 Safari/537.36",
								    "x-csrftoken": reqData.csrf,
						//			"x-instagram-ajax":"1",
						//			"x-requested-with":"XMLHttpRequest"
								}
							};

							const postReq = https.request(postReqOptions, function(res) {
						        console.log('SERVER::POST: ' + postReqOptions.hostname + postReqOptions.path, res.statusCode);

						        let instaData = '';
								res.on('data', (chunk) => {
									instaData += chunk;
								});

								res.on('end', () => {
									servRes.writeHeader(200, {"Content-Type": "text/html"});
									servRes.write(html);
									servRes.write('<script> window._data = ' + JSON.stringify(instaData)  + '; _data = JSON.parse(_data); window._onDataLoaded && _onDataLoaded(_data) </script>');
									servRes.end();
								});
						     });

							postReq.write(postData);
							postReq.end();
						});

					} 
					else { // no such user
						servRes.end('404, sorry, no such user');
					}
		    		
		    	}); // end: https.get

		   	} // end: serve root
		}).listen(PORT);
		
    console.log(`SERVER:: Listening on port ${PORT} ...`);

}); // end: readFile