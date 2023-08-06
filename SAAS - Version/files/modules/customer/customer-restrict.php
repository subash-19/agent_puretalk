<?php 
session_start();
require_once("../../inc/includes.php");

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Check user agent
if (!isset($_SESSION['user_agent'])) {
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
} elseif ($_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
    session_unset();
    session_destroy();
    header("Location: /sign-in");
    die();
}

// Check client IP
if (!isset($_SESSION['ip_address'])) {
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
} elseif ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR']) {
    session_unset();
    session_destroy();
    header("Location: /sign-in");
    die();
}

// Regenerate session id after login
if (!isset($_SESSION['regenerated_id'])) {
    session_regenerate_id(true);
    $_SESSION['regenerated_id'] = true;
}

if(isset($_SESSION['id_customer'])){
    $checkUserData = $customers->get($_SESSION['id_customer']);
}

if (!isset($_SESSION['id_customer']) || empty($_SESSION['id_customer']) || !$checkUserData->id) {
    header("Location: /sign-in");
    die();
}
