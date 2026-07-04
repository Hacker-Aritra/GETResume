<?php
require_once __DIR__ . '/../config/bootstrap.php';

$userId = require_login();
$input  = json_input();
$id     = isset($input['id']) ? (int) $input['id'] : (isset($_GET['id']) ? (int) $_GET['id'] : 0);

if (!$id) {
    respond(false, ['message' => 'Resume id is required.'], 422);
}

$stmt = $pdo->prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $userId]);

if ($stmt->rowCount() === 0) {
    respond(false, ['message' => 'Resume not found.'], 404);
}

respond(true, ['message' => 'Resume deleted.']);
