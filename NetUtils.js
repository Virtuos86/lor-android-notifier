var LOGGED_IN = false;

var AUTH_URL = 'https://www.linux.org.ru//ajax_login_process/';
var COUNTER_URL = 'https://www.linux.org.ru/notifications-count';
var MAIN_URL = 'http://linux.org.ru';
var NOTIFICATIONS_URL = 'https://www.linux.org.ru/notifications';

var HTTP_REQUEST = new XMLHttpRequest();

var PARAMS = {
    'nick': null, 
    'passwd': null, 
    'csrf': null
};

var BOUNDARY = String( Math.random() ).slice( 2 );
var BOUNDARY_MIDDLE = '--' + BOUNDARY + '\r\n';
var BOUNDARY_LAST = '--' + BOUNDARY + '--\r\n';

function constructRequestString()
{
    var body = ['\r\n'];
    for ( var key in PARAMS )
    {
        body.push( 'Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + PARAMS[key] + '\r\n' );
    };
    body = body.join( BOUNDARY_MIDDLE ) + BOUNDARY_LAST;
    return body;
};

function setSomeHeaders( httpRequest )
{
    httpRequest.setRequestHeader( 'User-Agent', 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.2.11) Gecko/20101012 Firefox/3.6.11' );
    httpRequest.setRequestHeader( 'Content-Type', 'multipart/form-data; boundary=' + BOUNDARY );
};

function getCsrf()
{
    HTTP_REQUEST.open( 'GET', MAIN_URL, false );
    setSomeHeaders( HTTP_REQUEST );
    HTTP_REQUEST.onreadystatechange = function() {};
    HTTP_REQUEST.send( null );
    var resp = HTTP_REQUEST.responseText;
    var marker = 'name="csrf" value="';
    var start = resp.indexOf( marker ) + marker.length;
    var stop = start + resp.slice( start, -1 ).indexOf( '">' );
    var csrf_token = resp.slice( start, stop );
    return csrf_token;
};

function notificount( callback )
{
    HTTP_REQUEST.open( 'GET', COUNTER_URL, true );
    var timeout = setTimeout( function() { HTTP_REQUEST.abort(); }, 30000 );
    setSomeHeaders( HTTP_REQUEST );
    HTTP_REQUEST.onreadystatechange = function() { clearTimeout( timeout ); callback( HTTP_REQUEST ); };
    HTTP_REQUEST.send( constructRequestString() );
};

function auth( username, password )
{
    if( PARAMS.csrf === null)
    {
        PARAMS.csrf = getCsrf();
    };
    PARAMS.nick = username;
    PARAMS.passwd = password;
    HTTP_REQUEST.open( 'POST', AUTH_URL, false );
    setSomeHeaders( HTTP_REQUEST );
    HTTP_REQUEST.send( constructRequestString() );
    resp = JSON.parse( HTTP_REQUEST.responseText );
    if( resp.loggedIn == true )
    {
        LOGGED_IN = true;
        return true;
    }
    else
        return false;
};
