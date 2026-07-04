<?php
/**
 * Shared bootstrap included by every API endpoint.
 * Handles sessions, JSON headers, CORS (for local dev) and small helpers.
 */

// --- CORS: allow the frontend (served from XAMPP too) to call these APIs ---
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

require_once __DIR__ . '/db.php';

// Config for reaching the Python AI microservice
define('AI_SERVICE_URL', 'http://127.0.0.1:5000');

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(bool $success, $payload = [], int $status = 200): void {
    http_response_code($status);
    $out = array_merge(['success' => $success], is_array($payload) ? $payload : ['data' => $payload]);
    echo json_encode($out);
    exit;
}

function require_login(): int {
    if (empty($_SESSION['user_id'])) {
        respond(false, ['message' => 'Not authenticated. Please log in.'], 401);
    }
    return (int) $_SESSION['user_id'];
}
