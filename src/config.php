<?php
	define( "VERSION" , "1.0.0" );
	define( "CSS_VER" , "1.0.0" );
	define( "JS_VER" , "1.0.0" );

    session_start();

//======================================================================
// Global Site Config
//======================================================================

	date_default_timezone_set("Australia/Perth");

	define( "PROD_OFFSET" , 0 );

	define( "HOME_DATE_MAX" , 14 );

	define( "UNIX_LAUNCH_TIME" , 1622476800 );
	# Tue Jun 1 2021 00:00:00 GMT+0800

	define( "GLOBAL_URL", dirname(__FILE__) );

	define( "SITE_URL" , "http://localhost/Computer-Science-ATAR/dist" );

	define( "ROUTER_HTTP" , "http://" );

	define( "SRV_NAME" , "Computer Science" );

	define( "SRV_ABBR" , "CompSci" );

	define( "SRV_META" , "Cool computer science project" );

//======================================================================
// User Config
//======================================================================

	define( "USER_TIMEOUT" , "3000" );
	# Time (seconds) in user inactivity before logging out automatically

	define( "ENCRYPTION_LEVEL" , "24" );
	# The number of random characters which are encoded for user hashes

	define( "ENCRYPTION_CHARS" , "abcdefghijklmnopqrstuvwxyz"
								."ABCDEFGHIJKLMNOPQRSTUVWXYZ"
								."0123456789!@#$%^&*()");
	# The range of characters that are used for hash encryption
	
	define( "ADMIN_USER" , "root" );
	# The user that can access user management
	
	define( "DB_HOST" , "localhost" );

	define( "DB_USER" , "root" );

	define( "DB_PASS" , "" );

	define( "DB_NAME" , "admin" );

//======================================================================
// Variable Config
//======================================================================

	define( "MONTHS_L" , ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] );
	
	define( "MONTHS_S" , ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'] );

	define( "LAUNCH_YEAR" , date("Y", UNIX_LAUNCH_TIME) );

	define( "LAUNCH_MONTH" , date("n", UNIX_LAUNCH_TIME) );

	define( "LAUNCH_DAY" , date("j", UNIX_LAUNCH_TIME) );

//======================================================================
// Global Functions
//======================================================================

	function formatTime($unixtimestamp) {
		if (date("j n Y") == date("j n Y", $unixtimestamp)) {
			return "today at ".date("g:i A", $unixtimestamp);
		} else if (date("j n Y" == date("j n Y"), ($unixtimestamp - 86400))) {
			return "yesterday at ".date("g:i A", $unixtimestamp);
		} else {
			return date("j/n/Y", $unixtimestamp);
		}
	}

?>