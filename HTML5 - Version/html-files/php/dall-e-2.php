<?php
ini_set("display_errors", 0);
include('key.php');
//include('demo-dall-e-2.php');

$header = [
    "Authorization: Bearer " . $API_KEY,
    "Content-type: application/json",
];

$model = "";
$num_images = 0;
$prompt = "";
$size = "";

// Read input data
$data = file_get_contents("php://input");
if (is_string($data)) {
    $data = json_decode($data, true);
    $model = $data["model"];
    $num_images = $data["num_images"];
    $prompt = $data["prompt"];
    $size = $data["size"];
}

$url = "https://api.openai.com/v1/images/generations";
$params = json_encode([
    "prompt" => $prompt,
    "model" => $model,
    "num_images" => $num_images,
    "size" => $size
]);

// Initialize cURL
$curl = curl_init($url);
$options = [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $header,
    CURLOPT_POSTFIELDS => $params,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
];
curl_setopt_array($curl, $options);
$response = curl_exec($curl);

if ($response === false) {
    echo json_encode([
        "status" => 0,
        "message" => "An error occurred: " . curl_error($curl),
    ]);
    die();
}

$httpcode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

if ($httpcode == 401) {
    $r = json_decode($response);
    echo json_encode([
        "status" => 0,
        "message" => $r->error->message,
    ]);
    die();
}
if ($httpcode == 200) {
    $json_array = json_decode($response, true);
    echo json_encode([
        "status" => 1,
        "message" => $json_array,
    ]);
} else {
	$r = json_decode($response);
	echo json_encode([
	    "status" => 0,
	    "message" => "Error HTTP code " . $httpcode." - ".$r->error->message,
	]);
}