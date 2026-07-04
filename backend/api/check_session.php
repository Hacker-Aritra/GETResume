<?php
require_once __DIR__ . '/../config/bootstrap.php';

if (empty($_SESSION['user_id'])) {
    respond(true, ['logged_in' => false]);
}

respond(true, [
    'logged_in' => true,
    'user' => ['id' => $_SESSION['user_id'], 'full_name' => $_SESSION['user_name']]
]);
