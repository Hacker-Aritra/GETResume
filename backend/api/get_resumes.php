<?php
require_once __DIR__ . '/../config/bootstrap.php';

$userId = require_login();

$stmt = $pdo->prepare('SELECT id, title, template, ats_score, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC');
$stmt->execute([$userId]);
$resumes = $stmt->fetchAll();

respond(true, ['resumes' => $resumes]);
