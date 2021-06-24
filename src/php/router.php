<?php
    // Routing
    $current_url = ROUTER_HTTP . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    // echo $current_url;
    // echo '<br>';
    $dir = "";
    $request = str_replace(strtolower(SITE_URL).$dir, '', $current_url);
    $raw = $request;
    $request = str_replace('/', '', $request);
    $request = strtolower($request);
    // echo $raw;
    // echo '<br>';
    // echo $request;

    if ($request == '') {
        include_once(GLOBAL_URL.'/php/index.php');
    } else if ($request == 'console') {
        include_once(GLOBAL_URL.'/php/console.php');
    } else if ($request == 'a') {
        echo 'Hello World';
    } else {
        echo $raw.'End';
    }
?>