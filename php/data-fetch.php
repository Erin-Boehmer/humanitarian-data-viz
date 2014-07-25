<?php
function fetchData($operation) {
	error_reporting( error_reporting() & ~E_NOTICE );
	$username = "unochaviz"; 
	$password = "4fU8xNjMDcEK";   
	$host = "unocha.ck9lcpfkyytw.us-east-1.rds.amazonaws.com";
	$database="unocha";

	$connection = pg_connect("host=$host port=5432 dbname=$database user=$username password=$password") or die('Cannot connect to host:');
	
	if(isset($_GET['residence'])) {
		$residence = $_GET['residence'];
	}

	$origin = $_GET['origin'];
	switch ($operation) {
		case 'asylum':
			$query = fetchAsylumData($origin, $residence);
			break;	
		case 'migration': 
			$query = fetchMigrationData($origin, $residence);
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
function fetchAsylumData($origin, $residence) {
	$query = 'SELECT * FROM asylum_flows WHERE ';
	$clauses = array();

	if ($residence) {
		$clauses[] = "residence = '$residence'";
	}

	if ($origin) {
		$clauses[] = "origin = '$origin'";
	}
	if ($clauses) {
		$query .= implode(' AND ',$clauses);
	}
	
	return $query;
}

/**
 * Returns query for fetching migration data for specified origin and residence country.
 */
function fetchMigrationData($origin, $residence) {
	$query = 'SELECT * FROM asylum_flows WHERE';
	$clauses = array();

	if ($residence) {
		$clauses[] = "country = '$residence'";
	}

	if ($origin) {
		$clauses[] = "country_of_origin = '$origin'";
	}
	if ($clauses) {
		$query .= implode(' AND ',$clauses);
	}
	
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
