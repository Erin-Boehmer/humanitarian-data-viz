<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

function fetchData($operation) {
	error_reporting( error_reporting() & ~E_NOTICE );
	$username = "unochaviz"; 
	$password = "4fU8xNjMDcEK";   
	$host = "unocha.ck9lcpfkyytw.us-east-1.rds.amazonaws.com";
	$database="unocha";

	$connection = pg_connect("host=$host port=5432 dbname=$database user=$username password=$password") or die('Cannot connect to host:');
	
	$origin = $_GET['origin'];
	switch ($operation) {
		case 'asylum':
			$query = fetchAsylumData($origin);
			break;	
		case 'migration': 
			$query = fetchMigrationData($origin);
			break;
		case 'indicator':
			$query = fetchIndicatorData($origin);
			break;
		default:
			exit();
	}

	$result = pg_query($connection, $query);

	if (!$result) {
		echo "Problem with query " . $query . "<br/>";
		echo pg_last_error(); 
		exit(); 
	}
	$data = array();
	while($myrow = pg_fetch_assoc($result)) {
		$data[] = $myrow; 
	}

	$data = json_encode($data);
	echo $data;

}

/**
 * Returns query for fetching asylum data for specified origin and residence country.
 */
function fetchAsylumData($origin) {
	$query = "SELECT year, residence, origin, applied_during_year FROM asylum_flows WHERE origin = '" . $origin . "';";
	
	return $query;
}

/**
 * Returns query for fetching migration data for specified origin and residence country.
 */
function fetchMigrationData($origin) {
	$query = "SELECT country, country_of_origin, year, value FROM migration_flows WHERE country_of_origin = '" . $origin . "';";
	return $query;
}

/**
 * Returns query for fetching indicator data for country.
 */
function fetchIndicatorData($country) {

}


$operation = $_GET['operation'];
fetchData($operation);
?>
