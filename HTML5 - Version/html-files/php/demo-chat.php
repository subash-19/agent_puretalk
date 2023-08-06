<?php 
session_start();
$chat_number = 20;
if (!isset($_SESSION['requests_aigency_v1'])) {
  $_SESSION['requests_aigency_v1'] = 0;
}

if ($_SESSION['requests_aigency_v1'] >= $chat_number) {
    echo json_encode([
        "status" => 0,
        "message" => "The maximum limit of conversations in demo mode has been reached.",
    ]);
  die();
}
$_SESSION['requests_aigency_v1']++;