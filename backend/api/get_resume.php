<?php
require_once __DIR__ . '/../config/bootstrap.php';

$userId = require_login();
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if (!$id) {
    respond(false, ['message' => 'Resume id is required.'], 422);
}

$stmt = $pdo->prepare('SELECT id, title, template, data, ats_score, created_at, updated_at FROM resumes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $userId]);
$resume = $stmt->fetch();

if (!$resume) {
    respond(false, ['message' => 'Resume not found.'], 404);
}

$resume['data'] = json_decode($resume['data'], true);

respond(true, ['resume' => $resume]);
