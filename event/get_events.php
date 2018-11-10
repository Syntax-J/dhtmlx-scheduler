<?php

$data_str = file_get_contents('JSON_feeder.json');

$event_data = json_decode( $data_str, true );

if ( isset( $_GET['year'], $_GET['month'] ) ) {
	$month = $_GET['month'];
	$year = $_GET['year'];
} else {
	$now = new DateTime('now');
	$month = $now->format('m');
	$year = $now->format('Y');
}

$results = [];

foreach ( $event_data['data'] as $key => $event ) {
	$s_year = split( '-', date( 'Y-m-d', strtotime( $event['start_date'] ) ) )[0];
	$s_month = split( '-', date( 'Y-m-d', strtotime( $event['start_date'] ) ) )[1];

	$e_year = split( '-', date( 'Y-m-d', strtotime( $event['end_date'] ) ) )[0];
	$e_month = split( '-', date( 'Y-m-d', strtotime( $event['end_date'] ) ) )[1];

	if ( ( $s_month == $month && $s_year == $year ) || ( $e_year == $e_month && $e_year == $year ) ) {
		array_push( $results, $event_data['data'][$key] );
		continue;
	}
}

$event_data['data'] = $results;

echo json_encode( $event_data );
