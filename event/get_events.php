<?php

$event_list = json_decode( '[
	{
		"class": 1,
		"color": "#ff0000",
		"end_date": "10/26/2018 05:50",
		"id": 1,
		"instructor": 7,
		"size": 4,
		"start_date": "10/26/2018 01:30",
		"subscribers": [
			13
		],
		"text": "New event",
		"readOnly": true
	},
	{
		"class": 3,
		"color": "#ffff00",
		"end_date": "07/27/2018 05:20",
		"id": 2,
		"instructor": 5,
		"size": 2,
		"start_date": "07/27/2018 04:00",
		"subscribers": [],
		"text": "toa"
	},
	{
		"class": 1,
		"color": "#ff0000",
		"end_date": "07/18/2018 00:35",
		"id": 3,
		"instructor": 7,
		"size": 4,
		"start_date": "07/18/2018 00:30",
		"subscribers": [],
		"text": "New event"
	},
	{
		"class": 3,
		"color": "#ffff00",
		"end_date": "07/05/2018 00:05",
		"id": 4,
		"instructor": 5,
		"size": 2,
		"start_date": "07/05/2018 00:00",
		"subscribers": [
			3,
			20
		],
		"text": "cata"
	},
	{
		"class": 1,
		"color": "#ff0000",
		"end_date": "07/03/2018 00:05",
		"id": 5,
		"instructor": 7,
		"size": 4,
		"start_date": "07/03/2018 00:00",
		"subscribers": [
			13,
			22
		],
		"text": "aaaaa"
	}
]', true );


if ( isset( $_GET['year'], $_GET['month'] ) ) {
	$month = $_GET['month'];
	$year = $_GET['year'];
} else {
	$now = new DateTime('now');
	$month = $now->format('m');
	$year = $now->format('Y');
}

$results = [];

foreach ( $event_list as $key => $event ) {
	$s_year = split( '-', date( 'Y-m-d', strtotime( $event['start_date'] ) ) )[0];
	$s_month = split( '-', date( 'Y-m-d', strtotime( $event['start_date'] ) ) )[1];

	$e_year = split( '-', date( 'Y-m-d', strtotime( $event['end_date'] ) ) )[0];
	$e_month = split( '-', date( 'Y-m-d', strtotime( $event['end_date'] ) ) )[1];

	if ( ( $s_month == $month && $s_year == $year ) || ( $e_year == $e_month && $e_year == $year ) ) {
		array_push( $results, $event_list[$key] );
		continue;
	}
}

echo json_encode( $results );
