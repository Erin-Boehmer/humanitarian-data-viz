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
	$year = $_GET['year'];
	$indicator = $_GET['indicator'];
	switch ($operation) {
		case 'asylum_from':
			$query = fetchAsylumFromData($origin);
			break;	
		case 'asylum_to':
			$query = fetchAsylumToData($origin);
			break;	
		case 'migration_from': 
			$query = fetchMigrationFromData($origin);
			break;
		case 'migration_to': 
			$query = fetchMigrationToData($origin);
			break;
		case 'indicator':
			$query = fetchIndicatorData($indicator, $year);
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
function fetchAsylumFromData($origin) {
	$query = "SELECT year, residence, origin, applied_during_year FROM asylum_flows WHERE origin = '" . $origin . "';";
	return $query;
}

/**
 * Returns query for fetching asylum data for specified origin and residence country.
 */
function fetchAsylumToData($origin) {
	$query = "SELECT year, residence, origin, applied_during_year FROM asylum_flows WHERE residence = '" . $origin . "';";
	return $query;
}

/**
 * Returns query for fetching migration data for specified origin and residence country.
 */
function fetchMigrationFromData($origin) {
	$query = "SELECT country, country_of_origin, year, value FROM migration_flows WHERE country_of_origin = '" . $origin . "';";
	return $query;
}

/**
 * Returns query for fetching migration data for specified origin and residence country.
 */
function fetchMigrationToData($origin) {
	$query = "SELECT country, country_of_origin, year, value FROM migration_flows WHERE country = '" . $origin . "';";
	return $query;
}

/**
 * Returns query for fetching indicator data for country.
 */
function fetchIndicatorData($indicator, $year) {
	$query = "SELECT country, " . $indicator . " FROM indicators_new WHERE year = '" . $year . "';";
	return $query;
}


$operation = $_GET['operation'];
fetchData($operation);
?>
