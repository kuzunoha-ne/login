import fs from 'fs';
import http from 'http';
import querystring from 'querystring';

import NodeCache from 'node-cache';

const server = http.createServer();
const nodeCache = new NodeCache();

interface Cookies {
    sessionId:string
}

server.on('request', (req:http.IncomingMessage, res:http.ServerResponse) => {
    const cookies = cookieParser(req.headers.cookie);
    console.log({cookies});
    switch (req.url){
        case '/':
        const cookies = cookieParser(req.headers.cookie);
        if(searchSessionId(cookies)){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('Logined\n');
        } else {
            const loginHtml = fs.readFileSync('./html/index.html');
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(loginHtml);
        }
        break;
        case '/post':
        if(req.method != 'POST'){
            res.writeHead(403, {'Content-Type': 'text/plain'});
            res.end(`403 Not Allow MethodType. You Method is ${req.method}`);
        } else {
            let body = '';
            let post;
            req.on('data', (data) => {
                body += data;
                if (body.length > 1e6) { 
                    req.connection.destroy();
                }
            });
            req.on('end', ()=>{
                post = querystring.parse(body);
                console.log({post});
                if((post.email == 'hogehoge@email.com') && (post.password == 'piyopiyo')){
                    const sid = createSessionId();
                    res.writeHead(301, {
                        'Content-Type': 'text/html',
                        'Set-Cookie': `sessionId=${sid};Max-Age=60;`,
                        'Location': '/'
                    });
                    res.end('301 Login success and Redirect\n');
                } else {
                    res.writeHead(401, {'Content-Type': 'text/html'});
                    res.end('401 Unauthorixed\n');    
                }
            });
        }
        break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end(`404 Not Found`);
        break;
    }
});

const cookieParser:(str:string|undefined) => Cookies = (str)=> {
    if(!str) return {sessionId:''};
    const cookies:Cookies = {sessionId:''};
    str.split(';').forEach((cookie)=>{
        let parts = cookie.split('=');
        let key = parts[0];
        let value = parts[1];
        let part = {[key]: value}
        Object.assign(cookies, part);
    });
    return cookies;
}

const createSessionId:() => void = () =>{
    const newSessionId =`hogehoge_${new Date().toISOString()}`;
    nodeCache.set(newSessionId, "", 60);
    return newSessionId;
}

const searchSessionId = (cookies:Cookies) => {
    try {
        return nodeCache.has(cookies.sessionId);
    } catch (e) {
        console.log(e.message);
        return false;
    }
}

server.listen(9000, ()=>{
    console.log('listen http://127.0.0.1:9000\n');
});
