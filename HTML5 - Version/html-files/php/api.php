<?php
ini_set("display_errors", 0);
include('key.php');
//include('demo-chat.php');

// Read input data
$model = $_POST["model"];
$messages = $_POST["array_chat"];
$messages = urldecode($messages);
$messages = json_decode($messages, true);

$character_name = $_POST["character_name"];
$temperature = floatval($_POST["temperature"]);
$frequency_penalty = floatval($_POST["frequency_penalty"]);
$presence_penalty = floatval($_POST["presence_penalty"]);

$header = [
    "Authorization: Bearer " . $API_KEY,
    "Content-type: application/json",
];

if (strpos($model, "gpt") !== false) {
    //Turbo model
    $isTurbo = true;
    $url = "https://api.openai.com/v1/chat/completions";
    $params = json_encode([
        "messages" => $messages,
        "model" => $model,
        "temperature" => $temperature,
        "max_tokens" => 1024,
        "frequency_penalty" => $frequency_penalty,
        "presence_penalty" => $presence_penalty,
        "stream" => true
    ]);
} else {
    $isTurbo = false;
    //Not a turbo model
    $chat = "";
    foreach ($messages as $msg) {
        $role = $msg["role"];
        $content = $msg["content"];
        if ($role == "system" || $role == "assistant") {
            $chat .= "$character_name: $content\n";
        } elseif ($role == "user") {
            $chat .= "user: $content\n";
        }
    }
    $url = "https://api.openai.com/v1/engines/$model/completions";
    $params = json_encode([
        "prompt" => "The following is a conversation between $character_name and user: \n\n$chat",
        "temperature" => $temperature,
        "max_tokens" => 1024,
        "frequency_penalty" => 0,
        "presence_penalty" => 0,
        "stream" => true
    ]);
}

$curl = curl_init($url);
$options = [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $header,
    CURLOPT_POSTFIELDS => $params,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_WRITEFUNCTION => function($curl, $data) {
        //echo $curl;
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

        if ($httpCode != 200) {
           $r = json_decode($data);
           echo 'data: {"error": "[ERROR]","message":"'.$r->error->code."  ".$r->error->message.'"}' . PHP_EOL;
        }else{
            echo $data;
            ob_flush();
            flush();
            return strlen($data);
        }
    },
];

curl_setopt_array($curl, $options);
$response = curl_exec($curl);   