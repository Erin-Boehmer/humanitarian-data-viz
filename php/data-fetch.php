<?php
$username = "unochaviz"; 
$password = "4fU8xNjMDcEK";   
$host = "unocha.ck9lcpfkyytw.us-east-1.rds.amazonaws.com";
$database="unocha";

$connection = pg_connect("host=$host port=5432 dbname=$database user=$username password=$password") or die('Cannot connect to host:');

$origin = $_GET['origin'];
$residence = $_GET['residence'];

$query = 'SELECT * from asylum_flows';
$clauses = array();

if ($residence) {
	$clauses[] = "residence = '$residence'";
}

if ($origin) {
	$clauses[] = "origin = '$origin'";
}
if ($clauses) {
	$query .= ' WHERE '.implode(' AND ',$clauses);
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
?>
