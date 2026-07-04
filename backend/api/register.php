<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['message' => 'Method not allowed'], 405);
}

$input = json_input();
$fullName = trim($input['full_name'] ?? '');
$email    = trim(strtolower($input['email'] ?? ''));
$password = $input['password'] ?? '';

if ($fullName === '' || $email === '' || $password === '') {
    respond(false, ['message' => 'Full name, email and password are all required.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, ['message' => 'Please enter a valid email address.'], 422);
}
if (strlen($password) < 6) {
    respond(false, ['message' => 'Password must be at least 6 characters.'], 422);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    respond(false, ['message' => 'An account with this email already exists.'], 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$fullName, $email, $hash]);

$userId = (int) $pdo->lastInsertId();
$_SESSION['user_id']   = $userId;
$_SESSION['user_name'] = $fullName;

respond(true, ['message' => 'Account created successfully.', 'user' => ['id' => $userId, 'full_name' => $fullName, 'email' => $email]]);
