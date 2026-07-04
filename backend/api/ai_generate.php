<?php
/**
 * Proxies AI requests from the frontend to the Python (Flask) AI microservice,
 * then logs the exchange to MySQL for history/auditing.
 *
 * Expected JSON body:
 * {
 *   "type": "summary" | "bullet" | "skills" | "ats_score",
 *   "payload": { ...fields the AI engine needs for that type... },
 *   "resume_id": 12   // optional
 * }
 */
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['message' => 'Method not allowed'], 405);
}

$userId = require_login();
$input  = json_input();

$type      = $input['type'] ?? '';
$payload   = $input['payload'] ?? [];
$resumeId  = isset($input['resume_id']) ? (int) $input['resume_id'] : null;

$allowedTypes = ['summary', 'bullet', 'skills', 'ats_score', 'cover_letter'];
if (!in_array($type, $allowedTypes, true)) {
    respond(false, ['message' => 'Unknown AI request type.'], 422);
}

// --- Call the Python AI microservice over HTTP ---
$ch = curl_init(AI_SERVICE_URL . '/' . $type);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 20,
]);
$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    respond(false, ['message' => 'AI service unreachable. Is ai-service/app.py running on port 5000? (' . $curlErr . ')'], 502);
}

$aiData = json_decode($response, true);
if ($httpCode >= 400 || !is_array($aiData)) {
    respond(false, ['message' => 'AI service returned an error.', 'raw' => $response], 502);
}

// --- Log the generation for history/auditing ---
$stmt = $pdo->prepare('INSERT INTO ai_generations (user_id, resume_id, request_type, input_text, output_text) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([
    $userId,
    $resumeId,
    $type,
    json_encode($payload, JSON_UNESCAPED_UNICODE),
    json_encode($aiData, JSON_UNESCAPED_UNICODE),
]);

respond(true, ['result' => $aiData]);
