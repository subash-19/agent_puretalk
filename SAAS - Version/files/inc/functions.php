<?php

// Function to redirect
function redirect($url, $message = '', $status = 'success') {
    $_SESSION['action'] = $status;
    $_SESSION['action_message'] = $message;
    header("location: $url");
    exit();
}

// Function to decode Unicode escape sequences.
function decodeUnicodeEscapeSequences($matches) {
    return mb_convert_encoding(pack('H*', $matches[1]), 'UTF-8', 'UCS-2BE');
}

// Function to process translations.
// This replaces Unicode escape sequences with their corresponding UTF-8 characters.
function processTranslations($translations) {
    foreach ($translations as $key => $value) {
        $translations[$key] = preg_replace_callback('/u([0-9a-fA-F]{4})/', 'decodeUnicodeEscapeSequences', $value);
    }
    return $translations;
}

// Function to merge two arrays, while checking for empty values.
// Values from the second array will overwrite those from the first,
// unless they are empty or the corresponding value in the first array doesn't exist.
function array_merge_check_empty($arr1, $arr2) {
    foreach ($arr2 as $key => $value) {
        if (is_array($value) && isset($arr1[$key])) {
            $arr1[$key] = array_merge_check_empty($arr1[$key], $arr2[$key]);
        } else {
            if (empty($value)) {
                continue;
            }
            $arr1[$key] = $value;
        }
    }
    return $arr1;
}

// Function to return the URL protocol (http or https) based on the $_SERVER superglobal.
function url() {
    if (isset($_SERVER['HTTPS'])) {
        $protocol = ($_SERVER['HTTPS'] && $_SERVER['HTTPS'] != "off") ? "https" : "http";
    } else {
        $protocol = 'http';
    }
    return $protocol . "://" . $_SERVER['HTTP_HOST'];
}

// Function to remove custom input from a given text.
// This removes any text starting with '↵↵' and ending with a period (inclusive).
function removeCustomInput($text) {
    // Procura a posição da primeira ocorrência de "↵↵"
    $pos = strpos($text, '↵↵');

    // Se a ocorrência for encontrada, remove tudo a partir dela
    if ($pos !== false) {
        $clean_text = substr($text, 0, $pos);
    } else {
        // Se não houver ocorrência de "↵↵", retorna o texto original
        $clean_text = $text;
    }

    return $clean_text;
}

function markdownParaHtml($texto) {
    $texto = nl2br($texto);  // Convert line breaks to <br/>
    $texto = preg_replace('/\*\*(.*?)\*\*/s', '<strong>$1</strong>', $texto);  // **text** to <strong>text</strong>
    $texto = preg_replace('/# (.*?)<br \/>/', '<h1>$1</h1>', $texto);  // # text to <h1>text</h1>
    $texto = preg_replace('/## (.*?)<br \/>/', '<h2>$1</h2>', $texto);  // ## text to <h2>text</h2>
    $texto = preg_replace('/### (.*?)<br \/>/', '<h3>$1</h3>', $texto);  // ### text to <h3>text</h3>
    return $texto;
}

// Function to reorder an array by a given id.
// This moves the item with the specified id to the start of the array.
function reorderArrayById($array, $id) {
    $reorderedArray = [];
    $itemWithId = null;

    foreach ($array as $item) {
        if ($item->id == $id) {
            $itemWithId = $item;
        } else {
            $reorderedArray[] = $item;
        }
    }

    if ($itemWithId) {
        array_unshift($reorderedArray, $itemWithId);
    }

    return $reorderedArray;
}

// Function to generate a new id for a thread.
function threadNewID() {
    return uniqid("thread_", true);
}

// Function to find a Stripe payment intent based on order id.
function findPaymentIntent($config, $id_order) {

    // List all PaymentIntents
    $paymentIntents = \Stripe\PaymentIntent::all();

    // Find the PaymentIntent with the matching id_order
    $paymentIntentFound = null;
    foreach ($paymentIntents->data as $paymentIntent) {
        if (isset($paymentIntent->metadata['id_order']) && $paymentIntent->metadata['id_order'] === $id_order) {
            $paymentIntentFound = $paymentIntent;
            break;
        }
    }

    return $paymentIntentFound;
}

// Function to truncate text to a specified maximum length.
// This cuts off the text at the last full word before the limit, and appends an ellipsis if the text was truncated.
// Line breaks are then converted to HTML <br> tags.
function truncateText($text, $maxLength) {
    if (strlen($text) > $maxLength) {
        $text = substr($text, 0, strrpos(substr($text, 0, $maxLength), ' '));
        $text .= '...';
    }
    $text = nl2br($text);
    return $text;
}

function formatDate($date, $includeTime = false) {
    // Bring the variable into the function scope
    global $getDefaultLanguage;

    // Define the language
    $lang = $getDefaultLanguage->lang;
    // Create a DateTime object from the input date
    $dateTime = new DateTime($date);

    // Format the date
    if ($includeTime) {
        // create a DateTimeFormatter
        $formatter = new IntlDateFormatter($lang,IntlDateFormatter::LONG,IntlDateFormatter::LONG);
        $formattedDate = $formatter->format($dateTime);
    } else {
        $formatter = new IntlDateFormatter($lang,IntlDateFormatter::LONG,IntlDateFormatter::NONE);
        $formattedDate = $formatter->format($dateTime);
    }

    return $formattedDate;
}

function createSitemapEntry($url, $lastmod = null, $priority = 0.5) {
    $sitemapEntry = "<url>\n";
    $sitemapEntry .= "\t<loc>{$url}</loc>\n";
    
    if ($lastmod) {
        $sitemapEntry .= "\t<lastmod>{$lastmod}</lastmod>\n";
    }

    $sitemapEntry .= "\t<priority>{$priority}</priority>\n";
    $sitemapEntry .= "</url>\n";

    return $sitemapEntry;
}

$user_credit_pack = array();
function getCustomerCreditPack($customerId) {
    global $customer_credits_packs, $credits_packs;
    $user_credit_pack = array();
    $getCreditPackCustomer = $customer_credits_packs->getByIdSucceededCustomer($customerId);

    foreach ($getCreditPackCustomer as $showCreditPackCustomer) {
        if($showCreditPackCustomer->id){
            $getTierCreditPack = $credits_packs->get($showCreditPackCustomer->id_credit_pack);
            $user_credit_pack[] = array(
                'tier' => $getTierCreditPack->tier,
                'id_credits_pack' => $showCreditPackCustomer->id_credit_pack
            );
        }
    }

    return $user_credit_pack;
}


function checkLoggedOutVipStatus($idPrompt, $prompts){
    $checkVipByIdPrompt = $prompts->checkVipByIdPrompt($idPrompt)->Fetch();
    return isset($checkVipByIdPrompt->id) && $checkVipByIdPrompt->id;
}

function checkLoggedInVipStatus($idPrompt, $prompts, $credits_packs, $user_credit_pack){
    global $config;
    $required_credit_pack = getRequiredCreditPack($idPrompt, $prompts, $credits_packs);

    if (empty($required_credit_pack)) {
        return false;
    }

    $required_tiers = array_column($required_credit_pack, 'tier');
    foreach($required_tiers as $required_tier) {
        foreach($user_credit_pack as $user_pack) {
            if(($config->vip_higher_tier == 1 ? $user_pack['tier'] >= $required_tier : $user_pack['tier'] == $required_tier)) {
                return false;
            }
        }
    }

    return true;
}

function getRequiredCreditPack($idPrompt, $prompts, $credits_packs){
    $required_credit_pack = array();
    $getVipByIdPrompt = $prompts->checkVipByIdPrompt($idPrompt);

    foreach ($getVipByIdPrompt as $showVipByIdPrompt) {
        $getTierCreditPack = $credits_packs->get($showVipByIdPrompt->id_credits_pack);
        if(is_object($getTierCreditPack) && property_exists($getTierCreditPack, 'status')){
            if($getTierCreditPack->status){
                $required_credit_pack[] = array(
                    'tier' => $getTierCreditPack->tier,
                    'id_credits_pack' => $showVipByIdPrompt->id_credits_pack
                );
            }
        }
    }

    return $required_credit_pack;
}
