app.LoadScript( 'NetUtils.js' );

var SETTINGS_PATH = "/data/data/ru.org.linux/shared_prefs/Settings.json";
var INTERVALS = {
    "1 hour": 3600000,
    "2 hour": 7200000,
    "3 hour": 10800000,
    "30 min": 1800000,
    "15 min": 900000,
    "5 min": 300000,
    "1 min": 60000
};
var MESSAGES = {
    "Go!": "Сервис готов!",
	"Service started": "Сервис запущен",
	"Service stopped": "Сервис остановлен",
	"Retry please": "Повтори еще раз",
    "Interval changed": "Интервал обновления изменен"
};

function loadSettings()
{
	if( !app.FileExists( SETTINGS_PATH ) )
	{
		 app.WriteFile( SETTINGS_PATH, '{"username":"","password":"","autoboot":false,"refreshAfter":"30 min"}');
	};
    return JSON.parse( app.ReadFile( SETTINGS_PATH ) );
};

function storeSettings()
{
    settings = { "username": username.GetText(), "password": password.GetText(), "autoboot": autoboot.GetChecked(), "refreshAfter": interval.GetText() };
    app.WriteFile( SETTINGS_PATH, JSON.stringify( settings ) );
};

function OnStart()
{
    settings = loadSettings();
    lay = app.CreateLayout( "linear", "VCenter,FillXY" );

    btn0= app.CreateButton( 'Открыть "Уведомления" на L.O.R.', 0.6, 0.2, "Alum" );
    btn0.SetMargins( 0, 0, 0, 0 );
    lay.AddChild( btn0 );
    btn0.SetOnTouch( btn_OnLOR);

    username = app.CreateTextEdit( settings.username || "Имя пользователя", 0.6, 0.1 );
    username.SetMargins( 0, 0.05, 0, 0 );
    username.SetTextSize( 22 );
    if( settings.username == "" )
    {
        lay.AddChild( username );
    };

    password = app.CreateTextEdit ( settings.password || "Пароль", 0.6, 0.1 );
    password.SetMargins( 0, 0, 0, 0 );
    password.SetTextSize( 22 );
    if( settings.password == "" )
    {
        lay.AddChild( password );
    };

    btn1 = app.CreateButton( "Логин", 0.6, 0.1, "Alum" );
    btn1.SetMargins( 0, 0, 0, 0 );
    lay.AddChild( btn1 );
    btn1.SetOnTouch( btn_OnLogin);
    
    btn2 = app.CreateButton( "Запуск сервиса", 0.6, 0.1, "Alum" );
    btn2.SetMargins( 0, 0, 0, 0 );
    lay.AddChild( btn2 );
    btn2.SetOnTouch( btn_OnStart);
    
    btn3 = app.CreateButton( "Остановка сервиса", 0.6, 0.1, "Alum" );
    btn3.SetMargins( 0, 0, 0, 0 );
    lay.AddChild( btn3 );
    btn3.SetOnTouch( btn_OnStop);
      
    app.AddLayout( lay );
    
    svc = app.CreateService( "this", "this", OnServiceReady );
    svc.SetOnMessage( OnServiceMessage );

    autoboot = app.CreateCheckBox( "Автостарт сервиса" );
    autoboot.SetMargins( 0, 0.02, 0, 0 );
    autoboot.SetOnTouch( btn_OnAutoboot );
    autoboot.SetChecked( settings.autoboot );
    lay.AddChild( autoboot );
    var intervals = settings.refreshAfter + ",";
    for( i in INTERVALS )
    {
       if( i != settings.refreshAfter )
           intervals += i + ",";
    };
    interval = app.CreateSpinner( intervals, 0.6 );
    interval.SetOnTouch( interval_OnChange );
    lay.AddChild( interval );
    };

function OnServiceReady()
{
      app.ShowPopup( "Сервис готовится" );
};

function OnServiceMessage( msg )
{
	if( MESSAGES[msg] !== undefined )
	    msg = MESSAGES[msg];
    app.ShowPopup( msg );
};

function btn_OnStop()
{
    svc.SendMessage( "stop" );
    svc.Stop();
    lay.RemoveChild( btn2 );
    lay.RemoveChild( btn3 );
};

function btn_OnLOR()
{
    app.OpenUrl( NOTIFICATIONS_URL );
};

function btn_OnLogin()
{
    if( LOGGED_IN )
        return;
    app.ShowProgress( "Авторизация" );
    try
    {
        var authCode = auth( username.GetText(), password.GetText() );
    }
    catch( err )
    {
        app.ShowPopup( "Ошибка сети\n" + err.message );
        app.HideProgress();
        return;
    };
    if( authCode === true )
    {
        app.HideProgress();
        lay.SetBackColor( "#deadbeef" );
        storeSettings();
        lay.RemoveChild( username );
        lay.RemoveChild( password );
        lay.RemoveChild( btn1 );
    }
    else
    {
        app.HideProgress();
        app.ShowPopup( "Попробуй еще раз. Возможно, вы ввели неверные имя пользователя и пароль" );
    };
};

function btn_OnAutoboot( isChecked )
{
    if( isChecked == true )
    {
        app.SetAutoBoot( "Service" );
        app.ShowPopup( "Сервис успешно добавлен в автозагрузку" );
    }
    else
    {
        app.SetAutoBoot( "none" );
        app.ShowPopup( "Сервис успешно удален из автозагрузки" );
    };
    storeSettings();
};

function interval_OnChange( item )
{
    settings.refreshAfter = item;
    svc.SendMessage( "interval:" + item );
    storeSettings();
};

function btn_OnStart()
{
    if( LOGGED_IN )
    {
        svc.SendMessage( "start" );
    }
    else
          app.ShowPopup( "Пожалуйста, авторизуйся" );
};