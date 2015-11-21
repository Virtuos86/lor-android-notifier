app.LoadScript( 'NetUtils.js' );

var timerId;
var INTERVALS = {
    "1 hour": 3600000,
    "2 hour": 7200000,
    "3 hour": 10800000,
    "30 min": 1800000,
    "15 min": 900000,
    "5 min": 300000,
    "1 min": 60000
};

function log( string )
{
    app.WriteFile( "log.txt", string + "\n", "Append" );
};

function loadSettings()
{
    return JSON.parse( app.ReadFile( "Settings.json" ) );
};
//function loadSettings()
//{
//    return {
//        "username": app.LoadText( "username", "" ),
//        "password": app.LoadText( "password", "" ),
//        "autoboot": app.LoadBoolean( "autoboot", false ),
//        "refreshAfter": app.LoadText( "refreshAfter", "30 min" ) 
//    };
//};

function OnStart()
{
    settings = loadSettings();
    notify = app.CreateNotification( "AutoCancel" );
    notify.SetLargeImage( "Img/LOR Notifier.png" );
    app.SendMessage( "Go!" );
    if( settings.autoboot && settings.username && settings.password )
        OnMessage( "start" );
};

function OnMessage( msg )
{
    if( msg == "start" )
    {
        settings = loadSettings();
        try
        {
            isAuth = auth( settings.username, settings.password );
        }
        catch( err )
        {
            if( settings.autoboot && settings.username && settings.password )
               timerId = setInterval( function() { OnMessage( "start" ); }, 60000 );
            return;
        };
        if( isAuth )
        {
            app.SendMessage( "Service started" );
            UpdateApp();
            timerId = setInterval( UpdateApp, INTERVALS[settings.refreshAfter] );
        }
        else
            app.SendMessage( "Retry please" );
    }
    else if( msg == "stop" )
    {
        app.SendMessage( "Service stopped" );
        notify.Cancel( "lor" );
        notify.Cancel();
    }
    else if( msg.split( ":" )[0] == "interval" )
    {
        if( LOGGED_IN )
        {
            clearInterval( timerId );
            settings = loadSettings();
            timerId = setInterval( UpdateApp, INTERVALS[settings.refreshAfter] );
        };
        app.SendMessage( "Interval changed" );
    };
};

function checkNotify( httpRequest )
{
    if( httpRequest.readyState == 4 ) 
    {
       if( httpRequest.status == 200 ) 
       {
            n = httpRequest.responseText;
            if( n.length == 1 )
                end = n
            else
                end = n.slice( -2, -1 );
            if( end == "1" )
                notifications = " уведомление"
            else if( ( end > 1 ) && ( end < 5) )
                notifications = " уведомления"
            else
                notifications = " уведомлений";
            now = new Date();
            notify.SetMessage( "…", now.toTimeString().split( " " )[0], n + notifications );
            notify.Notify( "lor" );
        };
    };
};

function UpdateApp()
{
    notificount( checkNotify );
};
