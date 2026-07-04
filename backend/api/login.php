<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['message' => 'Method not allowed'], 405);
}

$input = json_input();
$email    = trim(strtolower($input['email'] ?? ''));
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    respond(false, ['message' => 'Email and password are required.'], 422);
}

$stmt = $pdo->prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(false, ['message' => 'Invalid email or password.'], 401);
}

$_SESSION['user_id']   = (int) $user['id'];
$_SESSION['user_name'] = $user['full_name'];

respond(true, [
    'message' => 'Logged in successfully.',
    'user' => ['id' => $user['id'], 'full_name' => $user['full_name'], 'email' => $user['email']]
]);
