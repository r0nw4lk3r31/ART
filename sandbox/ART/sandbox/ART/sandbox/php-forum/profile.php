<?php
// User profile iframe
require 'config.php';
require 'functions.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$user = getUser($_SESSION['user_id']);
?>
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Profile</title>
    <link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'>
</head>
<body>
    <div class='container mt-2'>
        <h2>Profile</h2>
        <p>Username: <?php echo htmlspecialchars($user['username']); ?></p>
        <!-- More profile details would go here -->
    </div>
</body>
</html>