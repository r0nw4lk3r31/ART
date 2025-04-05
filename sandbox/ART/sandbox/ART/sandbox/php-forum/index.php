<?php
// Main page for the PHP forum
require 'config.php';
require 'functions.php';

// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

// Display the forum
?>
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>PHP Forum</title>
    <link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'>
</head>
<body>
    <div class='container mt-5'>
        <h1>Welcome to the PHP Forum</h1>
        <iframe src='chat.php' width='100%' height='400'></iframe>
        <div class='row'>
            <div class='col-md-8'>
                <!-- Forum posts will go here -->
            </div>
            <div class='col-md-4'>
                <iframe src='profile.php' width='100%' height='300'></iframe>
            </div>
        </div>
    </div>
</body>
</html>