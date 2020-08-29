<?php
date_default_timezone_set('Europe/Prague');
$nl = "\r\n";
$arrow = ' --> ';
$lines = array_filter(explode($nl.$nl, file_get_contents('This.Is.Not.Berlin.2019.ENG.srt')));



function addSeconds($time, $s = 119){
	$init = explode(',', $time);
	$sixties = explode(':', $init[0]);
	$time = mktime(intval($sixties[0], 10), intval($sixties[1], 10), intval($sixties[2], 10));
	return date('H:i:s', $time+$s).','.$init[1];
}
$res = '';
foreach($lines as $line){
	$parts = explode($nl, $line);
	$times = explode($arrow, $parts[1]);
	$parts[1] = addSeconds($times[0]).$arrow.addSeconds($times[1]);
	$res .= implode($nl, $parts).$nl.$nl;
}

file_put_contents("sub.srt", $res);


