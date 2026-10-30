<?php
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/functions.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
