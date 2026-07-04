<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['message' => 'Method not allowed'], 405);
}

$userId = require_login();
$input  = json_input();

$resumeId = isset($input['id']) ? (int) $input['id'] : null;
$title    = trim($input['title'] ?? 'Untitled Resume');
$template = trim($input['template'] ?? 'classic');
$data     = $input['data'] ?? null;
$atsScore = isset($input['ats_score']) ? (int) $input['ats_score'] : null;

if (!$data || !is_array($data)) {
    respond(false, ['message' => 'Resume data is required.'], 422);
}

$dataJson = json_encode($data, JSON_UNESCAPED_UNICODE);

if ($resumeId) {
    // Make sure the resume belongs to this user before updating
    $stmt = $pdo->prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?');
    $stmt->execute([$resumeId, $userId]);
    if (!$stmt->fetch()) {
        respond(false, ['message' => 'Resume not found.'], 404);
    }

    $stmt = $pdo->prepare('UPDATE resumes SET title = ?, template = ?, data = ?, ats_score = ? WHERE id = ? AND user_id = ?');
    $stmt->execute([$title, $template, $dataJson, $atsScore, $resumeId, $userId]);

    respond(true, ['message' => 'Resume updated.', 'id' => $resumeId]);
} else {
    $stmt = $pdo->prepare('INSERT INTO resumes (user_id, title, template, data, ats_score) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $title, $template, $dataJson, $atsScore]);
    $newId = (int) $pdo->lastInsertId();

    respond(true, ['message' => 'Resume saved.', 'id' => $newId]);
}
